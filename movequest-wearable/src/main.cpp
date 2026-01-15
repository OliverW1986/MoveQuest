#include <Arduino.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LIS3DH.h>
#include <Math.h>
#include <LittleFS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <AsyncJson.h>
#include <vector>
#include <algorithm>

#include "secrets.h"

#define MOTOR_PIN 14
#define LED_PIN 33

#define LIS3DH_SDA_PIN 26
#define LIS3DH_SCL_PIN 25

#define STEP_THRESHOLD 0.6f
#define STEP_DEBOUNCE_MS 250

const unsigned long DEFAULT_MOTOR_INTERVAL_MS = 1800000; // 30 minutes
const unsigned long MIN_MOTOR_INTERVAL_MS = 60000;        // 1 minute
const unsigned long MAX_MOTOR_INTERVAL_MS = 3600000;      // 60 minutes
const unsigned long SESSION_DURATION_MS = 1800000;        // 30 minute session window
const size_t MAX_SESSIONS = 10;                           // Store at most 10 sessions locally

struct DeviceConfig {
  unsigned long motorIntervalMs = DEFAULT_MOTOR_INTERVAL_MS;
  uint32_t sessionCounter = 1;
};

struct EventFrame {
  unsigned long ts;
  String type;
  float raw;
  float filtered;
  int steps;
};

AsyncWebServer server(80);
DeviceConfig config;

unsigned long lastSendTime = 0;
const unsigned long sampleIntervalMs = 500;

unsigned long lastStepTime = 0;
int stepCount = 0;

float filtered = 0.0f;

float current_ax = 0.0f;
float current_ay = 0.0f;
float current_az = 0.0f;
float current_magnitude = 0.0f;
float current_filtered_magnitude = 0.0f;

Adafruit_LIS3DH lis = Adafruit_LIS3DH();

bool sessionActive = false;
String currentSessionId;
unsigned long sessionStartTime = 0;
unsigned long lastMotorBuzzTime = 0;
size_t motorEventCount = 0;
size_t loggedSamples = 0;

std::vector<EventFrame> recentEvents;
const size_t RECENT_EVENT_LIMIT = 64;

String formatSessionId(uint32_t counter) {
  char buffer[20];
  snprintf(buffer, sizeof(buffer), "session-%06lu", static_cast<unsigned long>(counter));
  return String(buffer);
}

String sessionFilePath(const String &sessionId) {
  return String("/sessions/") + sessionId + ".json";
}

void pushRecentEvent(const String &type) {
  if (recentEvents.size() >= RECENT_EVENT_LIMIT) {
    recentEvents.erase(recentEvents.begin());
  }

  EventFrame frame{
      millis(),
      type,
      current_magnitude,
      current_filtered_magnitude,
      stepCount};
  recentEvents.push_back(frame);
}

bool saveConfig() {
  StaticJsonDocument<256> doc;
  doc["motorIntervalMs"] = config.motorIntervalMs;
  doc["sessionCounter"] = config.sessionCounter;

  File file = LittleFS.open("/config.json", "w");
  if (!file) {
    Serial.println("Failed to open config for writing");
    return false;
  }
  serializeJson(doc, file);
  file.close();
  return true;
}

void loadConfig() {
  if (!LittleFS.exists("/config.json")) {
    saveConfig();
    return;
  }

  File file = LittleFS.open("/config.json", "r");
  if (!file) {
    Serial.println("Could not open config file, using defaults");
    return;
  }

  StaticJsonDocument<256> doc;
  DeserializationError err = deserializeJson(doc, file);
  file.close();

  if (err) {
    Serial.print("Failed to read config, using defaults: ");
    Serial.println(err.c_str());
    return;
  }

  config.motorIntervalMs = doc["motorIntervalMs"] | DEFAULT_MOTOR_INTERVAL_MS;
  config.sessionCounter = doc["sessionCounter"] | 1;
}

void ensureSessionsDir() {
  if (!LittleFS.exists("/sessions")) {
    LittleFS.mkdir("/sessions");
  }
}

bool appendJsonLine(const String &path, const JsonDocument &doc) {
  File file = LittleFS.open(path, "a");
  if (!file) {
    Serial.println("Failed to open session file for append");
    return false;
  }
  if (serializeJson(doc, file) == 0) {
    Serial.println("Failed to write JSON line");
    file.close();
    return false;
  }
  file.println();
  file.close();
  return true;
}

std::vector<String> listSessionFiles() {
  std::vector<String> files;
  File root = LittleFS.open("/sessions");
  if (!root) {
    return files;
  }
  File file = root.openNextFile();
  while (file) {
    files.push_back(String(file.name()));
    file = root.openNextFile();
  }
  std::sort(files.begin(), files.end());
  return files;
}

void pruneSessionsIfNeeded() {
  auto files = listSessionFiles();
  while (files.size() >= MAX_SESSIONS) {
    String toRemove = files.front();
    Serial.print("Removing oldest session file: ");
    Serial.println(toRemove);
    LittleFS.remove(toRemove);
    files.erase(files.begin());
  }
}

void logSessionEvent(const char *type) {
  if (!sessionActive) {
    return;
  }

  StaticJsonDocument<256> doc;
  doc["ts"] = millis();
  doc["type"] = type;
  doc["steps"] = stepCount;
  doc["raw"] = current_magnitude;
  doc["filtered"] = current_filtered_magnitude;

  appendJsonLine(sessionFilePath(currentSessionId), doc);
  pushRecentEvent(type);
}

void buzzMotor() {
  digitalWrite(MOTOR_PIN, HIGH);
  delay(200);
  digitalWrite(MOTOR_PIN, LOW);
  motorEventCount++;
  logSessionEvent("motor");
}

void stopSession(bool logStopEvent = true) {
  if (!sessionActive) {
    return;
  }

  if (logStopEvent) {
    StaticJsonDocument<256> doc;
    doc["ts"] = millis();
    doc["type"] = "session_stop";
    doc["durationMs"] = millis() - sessionStartTime;
    doc["steps"] = stepCount;
    doc["motorEvents"] = motorEventCount;
    appendJsonLine(sessionFilePath(currentSessionId), doc);
  }

  sessionActive = false;
  currentSessionId = "";
  sessionStartTime = 0;
}

void startSession(const String &requestedId = "") {
  if (sessionActive) {
    stopSession();
  }

  ensureSessionsDir();
  pruneSessionsIfNeeded();

  if (requestedId.length() > 0) {
    currentSessionId = requestedId;
  } else {
    currentSessionId = formatSessionId(config.sessionCounter++);
    saveConfig();
  }

  sessionActive = true;
  sessionStartTime = millis();
  lastMotorBuzzTime = millis();
  motorEventCount = 0;
  loggedSamples = 0;
  recentEvents.clear();

  StaticJsonDocument<256> doc;
  doc["ts"] = sessionStartTime;
  doc["type"] = "session_start";
  doc["sessionId"] = currentSessionId;
  doc["motorIntervalMs"] = config.motorIntervalMs;
  appendJsonLine(sessionFilePath(currentSessionId), doc);

  Serial.print("Session started: ");
  Serial.println(currentSessionId);
}

void processAccelerometer(float ax, float ay, float az) {
  float magnitude = sqrtf(ax * ax + ay * ay + az * az);
  current_magnitude = magnitude;

  filtered = 0.9f * filtered + 0.1f * (magnitude - 1.0f);
  current_filtered_magnitude = filtered;

  unsigned long now = millis();
  if (filtered > STEP_THRESHOLD) {
    if (now - lastStepTime > STEP_DEBOUNCE_MS) {
      stepCount++;
      lastStepTime = now;
      logSessionEvent("step");
    }
  }
}

void connectToWifi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - startAttempt > 20000) {
      Serial.println("\nWiFi connection timeout, retrying...");
      startAttempt = millis();
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    }
  }
  Serial.println("\nWiFi connected");
  digitalWrite(LED_BUILTIN, HIGH);
  digitalWrite(LED_PIN, HIGH);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void setupHttpApi() {
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  DefaultHeaders::Instance().addHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight requests
  server.onNotFound([](AsyncWebServerRequest *request) {
    if (request->method() == HTTP_OPTIONS) {
      request->send(200);
    } else {
      request->send(404);
    }
  });

  server.on("/api/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    doc["uptimeMs"] = millis();
    doc["motorIntervalMs"] = config.motorIntervalMs;
    doc["sessionActive"] = sessionActive;
    doc["sessionId"] = currentSessionId;
    doc["steps"] = stepCount;
    doc["motorEvents"] = motorEventCount;
    doc["loggedSamples"] = loggedSamples;
    doc["wifiRssi"] = WiFi.RSSI();
    doc["nextMotorInMs"] = sessionActive ? (config.motorIntervalMs - (millis() - lastMotorBuzzTime)) : -1;

    JsonArray events = doc.createNestedArray("recentEvents");
    for (auto &evt : recentEvents) {
      JsonObject e = events.createNestedObject();
      e["ts"] = evt.ts;
      e["type"] = evt.type;
      e["raw"] = evt.raw;
      e["filtered"] = evt.filtered;
      e["steps"] = evt.steps;
    }

    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });

  auto configHandler = new AsyncCallbackJsonWebHandler("/api/config", [](AsyncWebServerRequest *request, JsonVariant &json) {
    JsonObject obj = json.as<JsonObject>();
    if (!obj.containsKey("motorIntervalMs")) {
      request->send(400, "application/json", "{\"error\":\"motorIntervalMs required\"}");
      return;
    }

    unsigned long interval = obj["motorIntervalMs"];
    if (interval < MIN_MOTOR_INTERVAL_MS || interval > MAX_MOTOR_INTERVAL_MS) {
      request->send(400, "application/json", "{\"error\":\"interval out of range\"}");
      return;
    }

    config.motorIntervalMs = interval;
    saveConfig();
    lastMotorBuzzTime = millis();

    StaticJsonDocument<128> resp;
    resp["motorIntervalMs"] = config.motorIntervalMs;
    String body;
    serializeJson(resp, body);
    request->send(200, "application/json", body);
  });
  server.addHandler(configHandler);

  auto startHandler = new AsyncCallbackJsonWebHandler("/api/session/start", [](AsyncWebServerRequest *request, JsonVariant &json) {
    JsonObject obj = json.as<JsonObject>();
    String requestedId = obj.containsKey("sessionId") ? String(obj["sessionId"].as<const char *>()) : "";
    startSession(requestedId);

    StaticJsonDocument<256> resp;
    resp["sessionId"] = currentSessionId;
    resp["start"] = sessionStartTime;
    resp["motorIntervalMs"] = config.motorIntervalMs;
    String body;
    serializeJson(resp, body);
    request->send(200, "application/json", body);
  });
  server.addHandler(startHandler);

  server.on("/api/session/stop", HTTP_POST, [](AsyncWebServerRequest *request) {
    stopSession();
    request->send(200, "application/json", "{\"stopped\":true}");
  });

  server.on("/api/sessions", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<1024> doc;
    JsonArray arr = doc.createNestedArray("sessions");

    auto files = listSessionFiles();
    for (auto &path : files) {
      File f = LittleFS.open(path, "r");
      if (!f) {
        continue;
      }
      String firstLine = f.readStringUntil('\n');
      String lastLine = firstLine;
      while (f.available()) {
        lastLine = f.readStringUntil('\n');
      }
      f.close();

      JsonObject meta = arr.createNestedObject();
      meta["path"] = path;
      File sizeFile = LittleFS.open(path, "r");
      meta["size"] = sizeFile ? sizeFile.size() : 0;
      if (sizeFile) {
        sizeFile.close();
      }

      if (firstLine.length() > 0) {
        StaticJsonDocument<256> firstDoc;
        if (deserializeJson(firstDoc, firstLine) == DeserializationError::Ok) {
          meta["sessionId"] = firstDoc["sessionId"] | path;
          meta["start"] = firstDoc["ts"] | 0;
          meta["motorIntervalMs"] = firstDoc["motorIntervalMs"] | config.motorIntervalMs;
        }
      }

      if (lastLine.length() > 0) {
        StaticJsonDocument<256> lastDoc;
        if (deserializeJson(lastDoc, lastLine) == DeserializationError::Ok) {
          meta["end"] = lastDoc["ts"] | 0;
          meta["durationMs"] = lastDoc["durationMs"] | 0;
          meta["steps"] = lastDoc["steps"] | 0;
          meta["motorEvents"] = lastDoc["motorEvents"] | 0;
        }
      }
    }

    String body;
    serializeJson(doc, body);
    request->send(200, "application/json", body);
  });

  server.on("/api/session", HTTP_GET, [](AsyncWebServerRequest *request) {
    if (!request->hasParam("id")) {
      request->send(400, "application/json", "{\"error\":\"id required\"}");
      return;
    }
    String id = request->getParam("id")->value();
    String path = sessionFilePath(id);
    if (!LittleFS.exists(path)) {
      request->send(404, "application/json", "{\"error\":\"session not found\"}");
      return;
    }

    File f = LittleFS.open(path, "r");
    if (!f) {
      request->send(500, "application/json", "{\"error\":\"cannot open session\"}");
      return;
    }

    String content = "[";
    bool first = true;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      if (line.length() == 0) {
        continue;
      }
      if (!first) {
        content += ",";
      }
      content += line;
      first = false;
    }
    f.close();
    content += "]";
    request->send(200, "application/json", content);
  });

  server.on("/api/motor/trigger", HTTP_POST, [](AsyncWebServerRequest *request) {
    buzzMotor();
    request->send(200, "application/json", "{\"triggered\":true}");
  });

  server.begin();
}

void setup() {
  Serial.begin(115200);
  Wire.begin(LIS3DH_SDA_PIN, LIS3DH_SCL_PIN);

  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  if (!LittleFS.begin(true)) {
    Serial.println("LittleFS mount failed");
  }

  loadConfig();
  ensureSessionsDir();

  if (!lis.begin(0x18)) {
    Serial.println("Could not start LIS3DH");
    while (1) {
      delay(10);
    }
  }

  lis.setRange(LIS3DH_RANGE_2_G);
  lis.setDataRate(LIS3DH_DATARATE_50_HZ);

  Serial.println("LIS3DH found!");

  connectToWifi();
  setupHttpApi();
}

void loop() {
  lis.read();

  current_ax = lis.x_g;
  current_ay = lis.y_g;
  current_az = lis.z_g;

  processAccelerometer(current_ax, current_ay, current_az);

  unsigned long now = millis();
  if (sessionActive && (now - lastMotorBuzzTime >= config.motorIntervalMs)) {
    lastMotorBuzzTime = now;
    buzzMotor();
  }

  if (sessionActive && (now - sessionStartTime >= SESSION_DURATION_MS)) {
    stopSession();
  }

  if (sessionActive && (now - lastSendTime >= sampleIntervalMs)) {
    logSessionEvent("sample");
    loggedSamples++;
    lastSendTime = now;
  }

  delay(20);
}
