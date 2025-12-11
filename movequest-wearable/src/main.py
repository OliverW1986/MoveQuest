import requests, csv, time

ESP32_IP = "172.20.10.2"
URL = f"http://{ESP32_IP}/data"
OUTPUT_CSV = "accel_log.csv"
INTERVAL = 0.05

def main():
    with open(OUTPUT_CSV, 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["timestamp_ms", "accel_x_g", "accel_y_g", "accel_z_g", "magnitude_g", "filtered_magnitude_g", "steps"])
        
        print(f"Logging data from {URL} to {OUTPUT_CSV}")
        print("Press Ctrl+C to stop.")

        try:
            while True:
                try:
                    response = requests.get(URL, timeout=1)
                    if response.status_code == 200:
                        data = response.text.strip()
                        parts = data.split(",")
                        if len(parts) == 7:
                            writer.writerow(parts)
                            csvfile.flush()
                            print(f"Logged: {parts}")
                        else:
                            print(f"Unexpected data format: {data}")
                    else:
                        print(f"HTTP error: {response.status_code}")
                except requests.RequestException as e:
                    print(f"Request error: {e}")

                time.sleep(INTERVAL)
        except KeyboardInterrupt:
            print("Logging stopped.")

if __name__ == "__main__":
    main()

# import serial, time, csv

# PORT = "COM3"
# BAUD = 115200
# OUT = "accel_log.csv"

# with serial.Serial(PORT, BAUD, timeout=1) as ser, open(OUT, 'w', newline='') as csvfile:
#     writer = csv.writer(csvfile)
#     writer.writerow(["timestamp_ms", "accel_x_mg", "accel_y_mg", "accel_z_mg"])
#     start = time.time()
#     while True:
#         line = ser.readline().decode("utf-8", errors="ignore").strip()
#         if not line:
#             continue
#         parts = line.split(",")
#         if len(parts) == 4 and parts[0].isdigit():
#             writer.writerow(parts)
#             print(f"Logged: {parts}")