#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
// #include <WebServer.h>
#include <ArduinoJson.h>
#include "secrets.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LIS3DH.h>
#include <Math.h>

#define MOTOR_PIN 14
#define LED_PIN 33

#define LIS3DH_SDA_PIN 26
#define LIS3DH_SCL_PIN 25

#define STEP_THRESHOLD 0.6f
#define STEP_DEBOUNCE_MS 250

unsigned long lastSendTime = 0;
const int sendInterval = 500;

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

// void handleData() {
//   String response = String(millis()) + "," +
//                     String(current_ax, 4) + "," +
//                     String(current_ay, 4) + "," +
//                     String(current_az, 4) + "," +
//                     String(current_magnitude, 4) + "," +
//                     String(current_filtered_magnitude, 4) + "," +
//                     String(stepCount) + "\n";

//   server.send(200, "text/plain", response);
// }

void sendToPythonServer() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Cannot send data to Python server.");
    return;
  }
  
  HTTPClient http;
  String url = "http://172.20.10.3:5000/api/step-data";  // Replace with your computer's IP
  
  http.setTimeout(5000);  // 5 second timeout
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<256> jsonDoc;
  jsonDoc["timestamp"] = millis() / 1000.0f;
  jsonDoc["steps"] = stepCount;
  jsonDoc["raw_magnitude"] = current_magnitude;
  jsonDoc["filtered_magnitude"] = current_filtered_magnitude;
  
  String json;
  serializeJson(jsonDoc, json);
  
  Serial.print("Sending to: ");
  Serial.println(url);
  
  int httpResponseCode = http.POST(json);
  
  if (httpResponseCode > 0) {
    Serial.print("[Python Server] Steps: ");
    Serial.print(stepCount);
    Serial.print(" | Raw: ");
    Serial.print(current_magnitude);
    Serial.print(" | Filtered: ");
    Serial.println(current_filtered_magnitude);
  } else {
    Serial.print("Error sending to Python server. Code: ");
    Serial.print(httpResponseCode);
    Serial.print(" | URL: ");
    Serial.println(url);
    Serial.print("Error: ");
    Serial.println(http.errorToString(httpResponseCode));
  }
  
  http.end();
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
  digitalWrite(LED_PIN, HIGH); // Turn on another LED to indicate successful connection
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
  Wire.begin(26, 25);
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);

  // pinMode(14, OUTPUT);
  // digitalWrite(14, LOW);

  // pinMode(33, OUTPUT);
  // digitalWrite(33, HIGH);

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

  digitalWrite(LED_BUILTIN, HIGH); // Indicate LIS3DH initialized

  lis.setRange(LIS3DH_RANGE_2_G);
  lis.setDataRate(LIS3DH_DATARATE_50_HZ);

  connectToWifi();
}

void loop() {
  // server.handleClient();

  lis.read();

  current_ax = lis.x_g;
  current_ay = lis.y_g;
  current_az = lis.z_g;

  processAccelerometer(current_ax, current_ay, current_az);

  unsigned long now = millis();
  if (now - lastSendTime >= sendInterval) {
    sendToPythonServer();
    // sendToFirestore();  // Uncomment when ready to send to Firestore
    lastSendTime = now;
  }

  // motorTimer += 20.0f;
  // if (motorTimer >= motorInterval) {
  //   motorTimer = 0.0f;
  //   digitalWrite(14, HIGH);
  //   delay(100);
  //   digitalWrite(14, LOW);
  // }

  delay(20);
}
