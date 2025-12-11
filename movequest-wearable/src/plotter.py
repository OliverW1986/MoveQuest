import csv
import matplotlib.pyplot as plt
from pathlib import Path

CSV_PATH = Path("accel_log.csv")
PNG_OUT = Path("accel_plot.png")

def load_csv(path):
    ts, ax, ay, az, mag, filtered_mag, steps = [], [], [], [], [], [], []
    with path.open(newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ts.append(int(row["timestamp_ms"]))
            ax.append(float(row["accel_x_g"]))
            ay.append(float(row["accel_y_g"]))
            az.append(float(row["accel_z_g"]))
            mag.append(float(row["magnitude_g"]))
            filtered_mag.append(float(row["filtered_magnitude_g"]))
            steps.append(int(row["steps"]))
    return ts, ax, ay, az, mag, filtered_mag, steps

def main():
    ts, ax, ay, az, mag, filtered_mag, steps = load_csv(CSV_PATH)

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
    
    # Plot accelerometer data
    ax1.plot(ts, ax, label="ax (g)", alpha=0.7)
    ax1.plot(ts, ay, label="ay (g)", alpha=0.7)
    ax1.plot(ts, az, label="az (g)", alpha=0.7)
    ax1.plot(ts, mag, label="magnitude (g)", linewidth=2, color='black')
    ax1.plot(ts, filtered_mag, label="filtered magnitude (g)", linewidth=2, color='blue')
    ax1.set_xlabel("time (ms)")
    ax1.set_ylabel("acceleration (g)")
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    ax1.set_title("Accelerometer Data")
    
    # Plot step count
    ax2.plot(ts, steps, label="step count", color='red', linewidth=2)
    ax2.set_xlabel("time (ms)")
    ax2.set_ylabel("steps")
    ax2.grid(True, alpha=0.3)
    ax2.legend()
    ax2.set_title("Step Count Over Time")
    
    fig.tight_layout()
    fig.savefig(PNG_OUT, dpi=150)
    plt.show()

if __name__ == "__main__":
    main()