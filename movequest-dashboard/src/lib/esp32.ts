import { Status, SessionMeta, EventFrame } from "./types";

async function api<T>(baseUrl: string, path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    cache: "no-cache",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

export function createESP32Client(baseUrl: string) {
  return {
    status: () => api<Status>(baseUrl, "/api/status"),
    setConfig: (motorIntervalMs: number) =>
      api<{ motorIntervalMs: number }>(baseUrl, "/api/config", {
        method: "POST",
        body: JSON.stringify({ motorIntervalMs }),
      }),
    startSession: (sessionId?: string) =>
      api<{ sessionId: string; start: number; motorIntervalMs: number }>(baseUrl, "/api/session/start", {
        method: "POST",
        body: JSON.stringify(sessionId ? { sessionId } : {}),
      }),
    stopSession: () => api(baseUrl, "/api/session/stop", { method: "POST" }),
    sessions: () => api<{ sessions: SessionMeta[] }>(baseUrl, "/api/sessions"),
    session: (id: string) => api<EventFrame[]>(baseUrl, `/api/session?id=${encodeURIComponent(id)}`),
    triggerMotor: () => api(baseUrl, "/api/motor/trigger", { method: "POST" }),
  };
}
