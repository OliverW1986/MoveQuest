#include <Arduino.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_LIS3DH.h>
#include <Math.h>

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define MOTOR_PIN 14
#define LED_PIN 33

#define LIS3DH_SDA_PIN 26
#define LIS3DH_SCL_PIN 25

#define STEP_THRESHOLD 0.6f
#define STEP_DEBOUNCE_MS 250

unsigned long lastSendTime = 0;
const int sendInterval = 2000;

unsigned long lastStepTime = 0;
int stepCount = 0;

unsigned long lastMotorBuzz = 0;
unsigned long motorInhibitUntil = 0;
const unsigned long motorInterval = 30000; // Activate motor every 30 seconds
float lastBuzzSeconds = 0.0f;

// BLE telemetry
bool bleDeviceConnected = false;
BLECharacteristic *telemetryCharacteristic = nullptr;

// Simple service/characteristic UUIDs (replace if you have a defined profile)
static const char *TELEMETRY_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
static const char *TELEMETRY_CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

float previousMagnitude = 0.0f;
float filtered = 0.0f;

float current_ax = 0.0f;
float current_ay = 0.0f;
float current_az = 0.0f;
float current_magnitude = 0.0f;
float current_filtered_magnitude = 0.0f;

Adafruit_LIS3DH lis = Adafruit_LIS3DH();

bool headerPrinted = false;

class TelemetryServerCallbacks : public BLEServerCallbacks
{
  void onConnect(BLEServer *pServer) override
  {
    bleDeviceConnected = true;
  }

  void onDisconnect(BLEServer *pServer) override
  {
    bleDeviceConnected = false;
    pServer->startAdvertising();
  }
};

void processAccelerometer(float ax, float ay, float az)
{
  float magnitude = sqrtf(ax * ax + ay * ay + az * az);
  current_magnitude = magnitude;

  filtered = 0.9f * filtered + 0.1f * (magnitude - 1.0f);

  current_filtered_magnitude = filtered;

  unsigned long now = millis();
  if (filtered > STEP_THRESHOLD)
  {
    if (now - lastStepTime > STEP_DEBOUNCE_MS)
    {
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

void initBle()
{
  BLEDevice::init("MoveQuest-Wearable");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new TelemetryServerCallbacks());

  BLEService *telemetryService = pServer->createService(TELEMETRY_SERVICE_UUID);
  telemetryCharacteristic = telemetryService->createCharacteristic(
      TELEMETRY_CHAR_UUID,
      BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_READ);

  // Descriptor required by some clients to allow notifications
  telemetryCharacteristic->addDescriptor(new BLE2902());

  telemetryService->start();

  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(TELEMETRY_SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE advertising started (notify on telemetry characteristic).");

  digitalWrite(LED_PIN, HIGH); // Indicate BLE initialized
}

void sendToBleClient()
{
  if (!bleDeviceConnected || telemetryCharacteristic == nullptr)
  {
    return;
  }

  StaticJsonDocument<256> jsonDoc;
  jsonDoc["timestamp"] = millis() / 1000.0f;
  jsonDoc["steps"] = stepCount;
  jsonDoc["raw_magnitude"] = current_magnitude;
  jsonDoc["filtered_magnitude"] = current_filtered_magnitude;
  jsonDoc["last_buzz"] = lastBuzzSeconds;

  String json;
  serializeJson(jsonDoc, json);

  telemetryCharacteristic->setValue(json.c_str());
  telemetryCharacteristic->notify();

  Serial.print("[BLE notify] Steps: ");
  Serial.print(stepCount);
  Serial.print(" | Raw: ");
  Serial.print(current_magnitude);
  Serial.print(" | Filtered: ");
  Serial.println(current_filtered_magnitude);
}

void buzzMotor(unsigned long now)
{
  if (now < motorInhibitUntil)
  {
    lastMotorBuzz = now;
    return;
  }

  static const unsigned long buzzOn = 120;
  static const unsigned long buzzOff = 120;
  static const uint8_t buzzRepeats = 3; // alarm-style triple buzz

  if (now - lastMotorBuzz >= motorInterval)
  {
    for (uint8_t i = 0; i < buzzRepeats; i++)
    {
      digitalWrite(MOTOR_PIN, HIGH);
      delay(buzzOn);
      digitalWrite(MOTOR_PIN, LOW);
      if (i + 1 < buzzRepeats)
      {
        delay(buzzOff);
      }
    }
    lastBuzzSeconds = millis() / 1000.0f;
    lastMotorBuzz = now;
  }
}

void setup()
{
  Serial.begin(115200);
  Wire.begin(26, 25);
  pinMode(LED_BUILTIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  digitalWrite(LED_PIN, LOW);
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  // Prevent buzzing during boot while peripherals initialize
  motorInhibitUntil = millis() + 5000;

  // pinMode(14, OUTPUT);
  // digitalWrite(14, LOW);

  // pinMode(33, OUTPUT);
  // digitalWrite(33, HIGH);

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

  initBle();
}

void loop()
{
  // server.handleClient();

  lis.read();

  current_ax = lis.x_g;
  current_ay = lis.y_g;
  current_az = lis.z_g;

  processAccelerometer(current_ax, current_ay, current_az);

  unsigned long now = millis();
  buzzMotor(now);
  if (now - lastSendTime >= sendInterval)
  {
    sendToBleClient();
    lastSendTime = now;
  }

  delay(20);
}