#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>
#include "secrets.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LIS3DH.h>
#include <Math.h>

#define STEP_THRESHOLD 1.2f
#define STEP_DEBOUNCE_MS 250

WebServer server(80);

unsigned long lastSendTime = 0;
const int sendInterval = 1000;

unsigned long lastStepTime = 0;
int stepCount = 0;

float previousMagnitude = 0.0f;
float filtered = 0.0f;

float current_ax = 0.0f;
float current_ay = 0.0f;
float current_az = 0.0f;
float current_magnitude = 0.0f;
float current_filtered_magnitude = 0.0f;

Adafruit_LIS3DH lis = Adafruit_LIS3DH();

bool headerPrinted = false;

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
      Serial.print("Step detected! Total steps: ");
      Serial.println(stepCount);
    }
  }

  previousMagnitude = magnitude;
}

void handleData() {
  String response = String(millis()) + "," +
                    String(current_ax, 4) + "," +
                    String(current_ay, 4) + "," +
                    String(current_az, 4) + "," +
                    String(current_magnitude, 4) + "," +
                    String(current_filtered_magnitude, 4) + "," +
                    String(stepCount) + "\n";

  server.send(200, "text/plain", response);
}

void connectToWifi() {
  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  digitalWrite(LED_BUILTIN, HIGH); // Turn on LED to indicate successful connection
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void sendToFirestore() {
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi not connected. Cannot send data to Firestore.");
    return;
  }
  
  HTTPClient http;

  String url = "https://firestore.googleapis.com/v1/projects/";
  url += FIREBASE_PROJECT;
  url += "/databases/(default)/documents/students/";
  url += STUDENT_ID;
  url += "?key=";
  url += FIREBASE_API_KEY;

  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> jsonDoc;
  JsonObject data = jsonDoc.createNestedObject("fields");

  data["id"]["stringValue"] = STUDENT_ID;
  data["name"]["stringValue"] = "Oliver";
  data["stepsToday"]["integerValue"] = stepCount;
  data["totalPoints"]["integerValue"] = 1500;
  data["level"]["integerValue"] = 5;

  String json;
  serializeJson(jsonDoc, json);

  int httpResponseCode = http.PATCH(json);

  Serial.print("HTTP Response code: ");
  Serial.println(httpResponseCode);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response from Firestore:");
    Serial.println(response);
  } else {
    Serial.print("Error on sending PATCH: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}

void setup() {
  Serial.begin(115200);
  Wire.begin();
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  Serial.println("LIS3DH Test");

  if (!lis.begin(0x18))
  {
    Serial.println("Could not start LIS3DH");
    while (1)
    {
      delay(10);
    }
  }
  
  Serial.println("LIS3DH found!");

  lis.setRange(LIS3DH_RANGE_2_G);
  lis.setDataRate(LIS3DH_DATARATE_50_HZ);

  connectToWifi();
  
  server.on("/data", handleData);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();

  lis.read();

  current_ax = lis.x_g;
  current_ay = lis.y_g;
  current_az = lis.z_g;

  processAccelerometer(current_ax, current_ay, current_az);

  delay(20);
}
