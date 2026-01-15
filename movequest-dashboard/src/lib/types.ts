export type EventFrame = {
  ts: number;
  type: string;
  raw?: number;
  filtered?: number;
  steps?: number;
};

export type Status = {
  uptimeMs: number;
  motorIntervalMs: number;
  sessionActive: boolean;
  sessionId: string;
  steps: number;
  motorEvents: number;
  loggedSamples: number;
  wifiRssi: number;
  nextMotorInMs: number;
  recentEvents: EventFrame[];
};

export type SessionMeta = {
  path: string;
  size: number;
  sessionId?: string;
  start?: number;
  end?: number;
  durationMs?: number;
  steps?: number;
  motorEvents?: number;
  motorIntervalMs?: number;
};
