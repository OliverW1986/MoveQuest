"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { createESP32Client } from "../lib/esp32";
import type { SessionMeta, Status } from "../lib/types";

type Device = {
  id: string;
  url: string;
  name: string;
  status: Status | null;
  sessions: SessionMeta[];
  error: string | null;
  loading: Record<string, boolean>;
};

export default function Page() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [newDeviceUrl, setNewDeviceUrl] = useState("http://172.20.10.2");
  const [newDeviceName, setNewDeviceName] = useState("");

  // Load devices from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("esp32-devices");
    if (saved) {
      const deviceConfigs = JSON.parse(saved) as { id: string; url: string; name: string }[];
      setDevices(
        deviceConfigs.map((d) => ({
          ...d,
          status: null,
          sessions: [],
          error: null,
          loading: {},
        }))
      );
    }
  }, []);

  // Save devices to localStorage whenever they change
  useEffect(() => {
    if (devices.length > 0) {
      const toSave = devices.map((d) => ({ id: d.id, url: d.url, name: d.name }));
      localStorage.setItem("esp32-devices", JSON.stringify(toSave));
    }
  }, [devices]);

  const setDeviceLoading = (deviceId: string, key: string, value: boolean) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === deviceId ? { ...d, loading: { ...d.loading, [key]: value } } : d))
    );
  };

  const refreshDevice = useCallback(async (deviceId: string) => {
    setDevices((prev) => {
      const device = prev.find((d) => d.id === deviceId);
      if (!device) return prev;

      const client = createESP32Client(device.url);
      client.status()
        .then((status) => client.sessions().then((sessionsData) => ({ status, sessionsData })))
        .then(({ status, sessionsData }) => {
          setDevices((p) =>
            p.map((d) =>
              d.id === deviceId
                ? { ...d, status, sessions: sessionsData.sessions || [], error: null }
                : d
            )
          );
        })
        .catch((err) => {
          setDevices((p) =>
            p.map((d) => (d.id === deviceId ? { ...d, error: (err as Error).message } : d))
          );
        });

      return prev;
    });
  }, []);

  const addDevice = () => {
    if (!newDeviceUrl) return;
    const id = Date.now().toString();
    const device: Device = {
      id,
      url: newDeviceUrl,
      name: newDeviceName || `ESP32 ${devices.length + 1}`,
      status: null,
      sessions: [],
      error: null,
      loading: {},
    };
    setDevices((prev) => [...prev, device]);
    setNewDeviceUrl("");
    setNewDeviceName("");
    setTimeout(() => refreshDevice(id), 100);
  };

  const removeDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter((d) => d.id !== deviceId));
  };

  // Auto-refresh all devices
  useEffect(() => {
    devices.forEach((d) => refreshDevice(d.id));
    const interval = setInterval(() => {
      setDevices((prev) => {
        prev.forEach((d) => refreshDevice(d.id));
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [devices, refreshDevice]);

  const handleSetInterval = async (deviceId: string, intervalMs: number) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    setDeviceLoading(deviceId, "setInterval", true);
    try {
      const client = createESP32Client(device.url);
      await client.setConfig(intervalMs);
      await refreshDevice(deviceId);
    } catch (err) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, error: (err as Error).message } : d))
      );
    } finally {
      setDeviceLoading(deviceId, "setInterval", false);
    }
  };

  const handleStart = async (deviceId: string, sessionId?: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    setDeviceLoading(deviceId, "start", true);
    try {
      const client = createESP32Client(device.url);
      await client.startSession(sessionId);
      await refreshDevice(deviceId);
    } catch (err) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, error: (err as Error).message } : d))
      );
    } finally {
      setDeviceLoading(deviceId, "start", false);
    }
  };

  const handleStop = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    setDeviceLoading(deviceId, "stop", true);
    try {
      const client = createESP32Client(device.url);
      await client.stopSession();
      await refreshDevice(deviceId);
    } catch (err) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, error: (err as Error).message } : d))
      );
    } finally {
      setDeviceLoading(deviceId, "stop", false);
    }
  };

  const handleTriggerMotor = async (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId);
    if (!device) return;

    setDeviceLoading(deviceId, "trigger", true);
    try {
      const client = createESP32Client(device.url);
      await client.triggerMotor();
      await refreshDevice(deviceId);
    } catch (err) {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? { ...d, error: (err as Error).message } : d))
      );
    } finally {
      setDeviceLoading(deviceId, "trigger", false);
    }
  };

  return (
    <div className="grid" style={{ gap: "20px" }}>
      <header className="grid two">
        <div>
          <h1 style={{ margin: 0, fontSize: "28px" }}>MoveQuest Testing Dashboard</h1>
          <p style={{ color: "var(--muted)", marginTop: 6 }}>
            Multi-device tester for ESP32 wearables. Add devices, configure motor intervals, and manage sessions.
          </p>
        </div>
      </header>

      <section className="card">
        <h3 style={{ marginTop: 0 }}>Add Device</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            className="input"
            placeholder="Device URL (e.g., http://172.20.10.2)"
            value={newDeviceUrl}
            onChange={(e) => setNewDeviceUrl(e.target.value)}
            style={{ flex: 2, minWidth: "200px" }}
          />
          <input
            className="input"
            placeholder="Device name (optional)"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            style={{ flex: 1, minWidth: "150px" }}
          />
          <button className="button" onClick={addDevice}>
            Add Device
          </button>
        </div>
      </section>

      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          onRemove={() => removeDevice(device.id)}
          onSetInterval={(ms) => handleSetInterval(device.id, ms)}
          onStart={(sessionId) => handleStart(device.id, sessionId)}
          onStop={() => handleStop(device.id)}
          onTriggerMotor={() => handleTriggerMotor(device.id)}
        />
      ))}

      {devices.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
          <p>No devices added yet. Add an ESP32 device above to get started.</p>
        </div>
      )}
    </div>
  );
}

function DeviceCard({
  device,
  onRemove,
  onSetInterval,
  onStart,
  onStop,
  onTriggerMotor,
}: {
  device: Device;
  onRemove: () => void;
  onSetInterval: (ms: number) => void;
  onStart: (sessionId?: string) => void;
  onStop: () => void;
  onTriggerMotor: () => void;
}) {
  const [intervalMs, setIntervalMs] = useState(1800000);
  const [customSessionId, setCustomSessionId] = useState("");

  useEffect(() => {
    if (device.status?.motorIntervalMs !== undefined) {
      setIntervalMs(device.status.motorIntervalMs);
    }
  }, [device.status?.motorIntervalMs]);

  const recentEvents = device.status?.recentEvents;
  const sparkline = useMemo(() => {
    if (!recentEvents?.length) return null;
    const max = Math.max(...recentEvents.map((e) => Math.abs(e.filtered ?? 0.01)));
    return (
      <div className="sparkline">
        {recentEvents.slice(-40).map((evt, idx) => {
          const height = max ? Math.min(32, Math.max(4, ((Math.abs(evt.filtered ?? 0) / max) * 32))) : 4;
          return <span key={`${evt.ts}-${idx}`} style={{ height }} title={`${evt.type} @ ${evt.filtered?.toFixed(2) ?? ""}`} />;
        })}
      </div>
    );
  }, [recentEvents]);

  return (
    <div className="card" style={{ borderLeft: device.error ? "3px solid #f85149" : "3px solid #58a6ff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px" }}>{device.name}</h2>
          <small style={{ color: "var(--muted)" }}>{device.url}</small>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {device.status?.sessionActive ? (
            <span className="badge">Active · {device.status.sessionId || "(auto)"}</span>
          ) : (
            <span className="badge" style={{ background: "rgba(240,136,62,0.14)", borderColor: "rgba(240,136,62,0.3)", color: "var(--warning)" }}>
              Idle
            </span>
          )}
          <button className="button ghost" onClick={onRemove} style={{ padding: "4px 8px", fontSize: "12px" }}>
            Remove
          </button>
        </div>
      </div>

      {device.error && (
        <div style={{ padding: 10, marginBottom: 16, borderRadius: 6, background: "rgba(248,81,73,0.1)", borderLeft: "3px solid #f85149" }}>
          <strong>Error:</strong> {device.error}
        </div>
      )}

      <div className="grid two" style={{ gap: 16, marginBottom: 16 }}>
        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Motor Interval</h4>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="input"
              type="number"
              min={60}
              max={3600}
              value={Math.round(intervalMs / 1000)}
              onChange={(e) => setIntervalMs(Number(e.target.value) * 1000)}
              style={{ flex: 1 }}
            />
            <button
              className="button"
              onClick={() => onSetInterval(intervalMs)}
              disabled={device.loading.setInterval}
            >
              {device.loading.setInterval ? "..." : "Save"}
            </button>
          </div>
          <small style={{ color: "var(--muted)" }}>
            Current: {(device.status?.motorIntervalMs ?? 0) / 60000} min
            {device.status?.nextMotorInMs !== undefined && device.status.nextMotorInMs >= 0 && (
              <> · Next: {Math.max(0, Math.round(device.status.nextMotorInMs / 1000))}s</>
            )}
          </small>
        </div>

        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Session Controls</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="input"
              placeholder="Session ID (optional)"
              value={customSessionId}
              onChange={(e) => setCustomSessionId(e.target.value)}
              style={{ flex: 1, minWidth: "120px" }}
            />
            <button
              className="button"
              onClick={() => onStart(customSessionId || undefined)}
              disabled={device.loading.start}
              style={{ whiteSpace: "nowrap" }}
            >
              {device.loading.start ? "..." : "Start"}
            </button>
            <button
              className="button ghost"
              onClick={onStop}
              disabled={device.loading.stop}
              style={{ whiteSpace: "nowrap" }}
            >
              {device.loading.stop ? "..." : "Stop"}
            </button>
            <button
              className="button"
              style={{ background: "var(--warning)", color: "#0d1117", whiteSpace: "nowrap" }}
              onClick={onTriggerMotor}
              disabled={device.loading.trigger}
            >
              {device.loading.trigger ? "..." : "Buzz"}
            </button>
          </div>
          <small style={{ color: "var(--muted)" }}>
            Steps: {device.status?.steps ?? 0} · Motors: {device.status?.motorEvents ?? 0} · RSSI: {device.status?.wifiRssi ?? 0} dBm
          </small>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Live Samples</h4>
        {sparkline || <p style={{ color: "var(--muted)", margin: 0 }}>No recent samples.</p>}
      </div>

      {device.sessions.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}>Sessions ({device.sessions.length})</h4>
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Duration</th>
                <th>Steps</th>
                <th>Motor</th>
                <th>Started</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              {device.sessions.slice(-5).reverse().map((s) => (
                <tr key={s.path}>
                  <td>{s.sessionId || s.path}</td>
                  <td>
                    {s.durationMs
                      ? `${Math.round(s.durationMs / 1000)}s`
                      : s.end && s.start
                      ? `${Math.round((s.end - s.start) / 1000)}s`
                      : "-"}
                  </td>
                  <td>{s.steps ?? "-"}</td>
                  <td>{s.motorEvents ?? "-"}</td>
                  <td>{s.start ? format(new Date(s.start), "HH:mm:ss") : "-"}</td>
                  <td>{Math.round((s.size || 0) / 1024)} KB</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

