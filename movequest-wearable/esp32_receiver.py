import asyncio
import struct
import csv
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque
from datetime import datetime
import matplotlib.dates as mdates
import threading
from flask import Flask, jsonify
from waitress import serve
import os
from pathlib import Path

from bleak import BleakClient, BleakScanner


def log(message):
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"[{timestamp}] {message}")

# Configuration
PORT = 5000
MAX_DATA_POINTS = 200  # Keep last 200 data points
DEVICE_NAME_PREFIX = "MoveQuest-Wearable"  # Will match devices starting with this
SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
CHAR_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
LOG_DIR = Path("logs")

app = Flask(__name__)

# Data storage per device
class DataStore:
    def __init__(self, device_name):
        self.device_name = device_name
        self.host_ts = deque(maxlen=MAX_DATA_POINTS)      # wall-clock on receipt
        self.device_ts = deque(maxlen=MAX_DATA_POINTS)    # seconds since boot (from device)
        self.steps = deque(maxlen=MAX_DATA_POINTS)
        self.raw_accel = deque(maxlen=MAX_DATA_POINTS)
        self.filtered_accel = deque(maxlen=MAX_DATA_POINTS)
        self.last_buzz = deque(maxlen=MAX_DATA_POINTS)    # last buzz wall-clock (host time when received)
        self.lock = threading.Lock()
        self.log_file = self._init_log_file()
    
    def _init_log_file(self):
        """Initialize CSV log file for this device."""
        LOG_DIR.mkdir(exist_ok=True)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        log_path = LOG_DIR / f"{self.device_name}_{timestamp}.csv"
        
        with open(log_path, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['host_timestamp', 'device_timestamp', 'steps', 'raw_magnitude', 
                           'filtered_magnitude', 'last_buzz', 'datetime'])
        
        log(f"Logging {self.device_name} data to: {log_path}")
        return log_path
    
    def add_data(self, host_ts, device_ts, steps, raw, filtered, buzz_ts=None):
        with self.lock:
            self.host_ts.append(host_ts)
            self.device_ts.append(device_ts)
            self.steps.append(steps)
            self.raw_accel.append(raw)
            self.filtered_accel.append(filtered)
            self.last_buzz.append(buzz_ts)
            
            # Log to CSV
            try:
                with open(self.log_file, 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        host_ts, device_ts, steps, raw, filtered, 
                        buzz_ts if buzz_ts else '', 
                        datetime.fromtimestamp(host_ts).strftime('%Y-%m-%d %H:%M:%S.%f')
                    ])
            except Exception as e:
                log(f"Error writing to log: {e}")
    
    def get_data(self):
        with self.lock:
            return {
                'timestamps': list(self.host_ts),
                'device_ts': list(self.device_ts),
                'steps': list(self.steps),
                'raw_accel': list(self.raw_accel),
                'filtered_accel': list(self.filtered_accel),
                'last_buzz': list(self.last_buzz),
            }

# Global dict of data stores by device address
device_stores = {}
device_stores_lock = threading.Lock()

# Track discovered devices so we don't spawn duplicate listeners
discovered_devices = set()
discovered_devices_lock = threading.Lock()

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get all stored data for all devices"""
    with device_stores_lock:
        all_data = {addr: store.get_data() for addr, store in device_stores.items()}
    return jsonify(all_data), 200

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get list of connected devices"""
    with device_stores_lock:
        devices = [{'address': addr, 'name': store.device_name} for addr, store in device_stores.items()]
    return jsonify(devices), 200


async def _ble_device_listener(device_address, device_name):
    """Listen to a single BLE device."""
    while True:
        try:
            log(f"[{device_name}] Connecting to {device_address}...")
            disconnected_event = asyncio.Event()

            def _on_disconnect(_client):
                log(f"[{device_name}] Disconnected.")
                disconnected_event.set()

            async with BleakClient(device_address, disconnected_callback=_on_disconnect) as client:
                # Get or create data store for this device
                with device_stores_lock:
                    if device_address not in device_stores:
                        device_stores[device_address] = DataStore(device_name)
                    data_store = device_stores[device_address]

                async def handle_notification(_sender: int, data: bytearray):
                    try:
                        # Binary format: 4 bytes timestamp + 4 bytes steps + 4 bytes raw + 4 bytes filtered + 4 bytes buzz + 1 byte isActive
                        if len(data) < 21:
                            log(f"[{device_name}] Invalid packet size: {len(data)}")
                            return
                        
                        # Unpack binary data (little-endian)
                        ts, steps, raw_magnitude, filtered_magnitude, buzz_ts = struct.unpack('<IIfff', data[:20])
                        is_active = data[20]
                        
                        # Convert device timestamp to host timestamp
                        host_ts = datetime.now().timestamp()
                        device_ts = float(ts)
                        
                        buzz_host_ts = None
                        if buzz_ts > 0 and device_ts > 0:
                            buzz_host_ts = host_ts - (device_ts - buzz_ts)

                        data_store.add_data(host_ts, device_ts, steps, raw_magnitude, filtered_magnitude, buzz_host_ts)

                        activity_status = "ACTIVE" if is_active else "STATIONARY"
                        buzz_info = f", Last buzz@{buzz_ts:.2f}s" if buzz_ts > 0 else ""
                        log(f"[{device_name}] [{activity_status}] Steps: {steps}, Raw: {raw_magnitude:.2f}, "
                            f"Filtered: {filtered_magnitude:.2f}{buzz_info}")
                    except struct.error as e:
                        log(f"[{device_name}] Error unpacking binary data: {e}")
                    except Exception as exc:
                        log(f"[{device_name}] Error processing notification: {exc}")

                await client.start_notify(CHAR_UUID, handle_notification)
                log(f"[{device_name}] Subscribed to telemetry. Listening...")

                while True:
                    if disconnected_event.is_set():
                        raise Exception("Device disconnected")
                    await asyncio.sleep(1)

        except Exception as exc:
            log(f"[{device_name}] Connection error: {exc}. Reconnecting in 5s...")
            with discovered_devices_lock:
                if device_address in discovered_devices:
                    discovered_devices.remove(device_address)
            await asyncio.sleep(5)


async def _ble_scanner_loop():
    """Continuously scan for new MoveQuest devices and spawn listeners."""
    while True:
        try:
            log("Scanning for MoveQuest devices...")
            devices = await BleakScanner.discover(timeout=5.0)
            
            for device in devices:
                if device.name and device.name.startswith(DEVICE_NAME_PREFIX):
                    with discovered_devices_lock:
                        already_discovered = device.address in discovered_devices
                        if not already_discovered:
                            discovered_devices.add(device.address)
                    if not already_discovered:
                        log(f"Found new device: {device.name} ({device.address})")
                        # Spawn a listener task for this device
                        asyncio.create_task(_ble_device_listener(device.address, device.name))
            
            await asyncio.sleep(10)  # Scan every 10 seconds
            
        except Exception as exc:
            log(f"Scanner error: {exc}")
            await asyncio.sleep(5)


def start_ble_listener():
    """Run the BLE scanner and listeners in their own thread/loop."""
    loop = asyncio.new_event_loop()

    def _run():
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_ble_scanner_loop())

    t = threading.Thread(target=_run, daemon=True)
    t.start()
    return t

def start_server():
    """Start Flask server in a thread"""
    log(f"Starting server on http://localhost:{PORT}")
    serve(app, host='0.0.0.0', port=PORT)

def plot_realtime():
    """Create real-time plots for all connected devices."""
    fig = plt.figure(figsize=(14, 10))
    fig.suptitle('MoveQuest Multi-Device Monitoring', fontsize=16, fontweight='bold')
    
    def animate(frame):
        fig.clear()
        
        with device_stores_lock:
            devices = list(device_stores.items())
        
        if not devices:
            # Show waiting message
            ax = fig.add_subplot(111)
            ax.text(0.5, 0.5, 'Waiting for devices...', 
                   ha='center', va='center', fontsize=14)
            ax.axis('off')
            return
        
        # Calculate grid layout
        num_devices = len(devices)
        cols = 2 if num_devices > 1 else 1
        rows = (num_devices + 1) // 2
        
        for idx, (device_addr, data_store) in enumerate(devices):
            data = data_store.get_data()
            
            if not data['timestamps']:
                continue
            
            # Create subplot for this device (2 rows per device: steps + accel)
            base_idx = idx * 2
            ax1 = plt.subplot(rows * 2, cols, base_idx + 1)
            ax2 = plt.subplot(rows * 2, cols, base_idx + 2)
            
            time_axis = [mdates.date2num(datetime.fromtimestamp(ts)) for ts in data['timestamps'] if ts]
            
            # Plot 1: Step Count
            ax1.plot(time_axis, data['steps'], 'g-', linewidth=2, label='Steps')
            ax1.fill_between(time_axis, data['steps'], alpha=0.3, color='green')
            ax1.set_ylabel('Step Count', fontsize=9, fontweight='bold')
            ax1.set_title(f'{data_store.device_name} - Steps', fontsize=10)
            ax1.grid(True, alpha=0.3)
            ax1.legend(fontsize=8)

            # Mark last buzz times on steps chart
            buzz_times = [t for t in data['last_buzz'] if t]
            if buzz_times:
                buzz_axis = [mdates.date2num(datetime.fromtimestamp(bt)) for bt in buzz_times]
                step_min = min(data['steps'], default=0)
                step_max = max(data['steps'], default=1)
                ax1.vlines(buzz_axis, ymin=step_min, ymax=step_max,
                          colors='red', linestyles='dashed', linewidth=1, label='Motor buzz')
            
            # Plot 2: Acceleration Magnitude
            ax2.plot(time_axis, data['raw_accel'], 'b-', label='Raw Magnitude', alpha=0.6, linewidth=1)
            ax2.plot(time_axis, data['filtered_accel'], 'r-', label='Filtered Magnitude', linewidth=2)
            ax2.axhline(y=0.4, color='orange', linestyle='--', label='Step Threshold', linewidth=1)
            ax2.set_xlabel('Time', fontsize=9, fontweight='bold')
            ax2.set_ylabel('Acceleration', fontsize=9, fontweight='bold')
            ax2.set_title(f'{data_store.device_name} - Acceleration', fontsize=10)
            ax2.grid(True, alpha=0.3)
            ax2.legend(fontsize=8)

            # Time formatting
            for ax in (ax1, ax2):
                ax.xaxis.set_major_formatter(mdates.DateFormatter('%H:%M:%S'))
                ax.tick_params(labelsize=8)
        
        plt.tight_layout()
    
    ani = animation.FuncAnimation(fig, animate, interval=500, cache_frame_data=False)
    plt.show()

if __name__ == '__main__':
    log("=" * 60)
    log("MoveQuest Multi-Device Data Logger & Visualizer")
    log("=" * 60)
    log(f"Log files will be saved to: {LOG_DIR.absolute()}")
    log(f"API endpoints: http://localhost:{PORT}/api/data, /api/devices")
    log("=" * 60)
    
    # Start BLE scanner/listeners
    start_ble_listener()

    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give server and scanner time to start
    import time
    time.sleep(3)
    
    # Start real-time plotting
    try:
        plot_realtime()
    except KeyboardInterrupt:
        log("Shutting down...")