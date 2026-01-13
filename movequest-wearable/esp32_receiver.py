import socket
import json
import matplotlib.pyplot as plt
import matplotlib.animation as animation
from collections import deque
from datetime import datetime
import threading
from flask import Flask, request, jsonify
from waitress import serve
import os

# Configuration
PORT = 5000
MAX_DATA_POINTS = 200  # Keep last 200 data points

app = Flask(__name__)

# Data storage
class DataStore:
    def __init__(self):
        self.timestamps = deque(maxlen=MAX_DATA_POINTS)
        self.steps = deque(maxlen=MAX_DATA_POINTS)
        self.raw_accel = deque(maxlen=MAX_DATA_POINTS)
        self.filtered_accel = deque(maxlen=MAX_DATA_POINTS)
        self.lock = threading.Lock()
    
    def add_data(self, timestamp, steps, raw, filtered):
        with self.lock:
            self.timestamps.append(timestamp)
            self.steps.append(steps)
            self.raw_accel.append(raw)
            self.filtered_accel.append(filtered)
    
    def get_data(self):
        with self.lock:
            return {
                'timestamps': list(self.timestamps),
                'steps': list(self.steps),
                'raw_accel': list(self.raw_accel),
                'filtered_accel': list(self.filtered_accel),
            }

data_store = DataStore()

@app.route('/api/step-data', methods=['POST'])
def receive_data():
    """Receive data from ESP32"""
    try:
        payload = request.json
        
        timestamp = payload.get('timestamp', datetime.now().timestamp())
        steps = payload.get('steps', 0)
        raw_magnitude = payload.get('raw_magnitude', 0)
        filtered_magnitude = payload.get('filtered_magnitude', 0)
        
        data_store.add_data(timestamp, steps, raw_magnitude, filtered_magnitude)
        
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Steps: {steps}, "
              f"Raw: {raw_magnitude:.2f}, Filtered: {filtered_magnitude:.2f}")
        
        return jsonify({'status': 'success'}), 200
    except Exception as e:
        print(f"Error receiving data: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 400

@app.route('/api/data', methods=['GET'])
def get_data():
    """Get all stored data"""
    return jsonify(data_store.get_data()), 200

def start_server():
    """Start Flask server in a thread"""
    print(f"Starting server on http://localhost:{PORT}")
    serve(app, host='0.0.0.0', port=PORT)

def plot_realtime():
    """Create real-time plots"""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
    fig.suptitle('ESP32 Step Detection - Real-Time Monitoring', fontsize=14, fontweight='bold')
    
    def animate(frame):
        ax1.clear()
        ax2.clear()
        
        data = data_store.get_data()
        
        if data['timestamps']:
            # Calculate seconds from start
            start_time = data['timestamps'][0]
            time_axis = [(t - start_time) for t in data['timestamps']]
            
            # Plot 1: Step Count
            ax1.plot(time_axis, data['steps'], 'g-', linewidth=2, label='Steps')
            ax1.fill_between(time_axis, data['steps'], alpha=0.3, color='green')
            ax1.set_ylabel('Step Count', fontsize=10, fontweight='bold')
            ax1.set_title('Total Steps Detected', fontsize=11)
            ax1.grid(True, alpha=0.3)
            ax1.legend()
            
            # Plot 2: Acceleration Magnitude
            ax2.plot(time_axis, data['raw_accel'], 'b-', label='Raw Magnitude', alpha=0.6, linewidth=1)
            ax2.plot(time_axis, data['filtered_accel'], 'r-', label='Filtered Magnitude', linewidth=2)
            ax2.axhline(y=1.2, color='orange', linestyle='--', label='Step Threshold', linewidth=1)
            ax2.set_xlabel('Time (seconds)', fontsize=10, fontweight='bold')
            ax2.set_ylabel('Acceleration', fontsize=10, fontweight='bold')
            ax2.set_title('Acceleration Magnitude', fontsize=11)
            ax2.grid(True, alpha=0.3)
            ax2.legend()
        
        plt.tight_layout()
    
    ani = animation.FuncAnimation(fig, animate, interval=500, cache_frame_data=False)
    plt.show()

if __name__ == '__main__':
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    
    # Give server time to start
    import time
    time.sleep(2)
    
    # Start real-time plotting
    try:
        plot_realtime()
    except KeyboardInterrupt:
        print("\nShutting down...")
