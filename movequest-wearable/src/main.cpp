#include <Arduino.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include "secrets.h"

unsigned long lastSendTime = 0;
const int sendInterval = 1000;

int stepCount = 0;
int postureScore = 100;

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
  pinMode(LED_BUILTIN, OUTPUT);
  connectToWifi();
}

void loop() {
  stepCount += random(1, 5);
  // postureScore = 90 + random(-5, 6);

  if (millis() - lastSendTime >= sendInterval) {
    Serial.println("Sending data to Firestore...");
    sendToFirestore();
    lastSendTime = millis();
  }

  delay(100);
}
