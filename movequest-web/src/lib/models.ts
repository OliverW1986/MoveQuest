// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'teacher';
  createdAt: Date;
  updatedAt: Date;
}

// Class types
export interface Class {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  grade?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Student types
export interface Student extends User {
  role: 'student';
  classIds: string[];
  totalScore: number;
  lastActiveAt?: Date;
}

// Teacher types
export interface Teacher extends User {
  role: 'teacher';
  classIds: string[];
}

// Activity types
export interface Activity {
  id: string;
  studentId: string;
  classId: string;
  type: 'steps' | 'exercise' | 'challenge';
  value: number;
  points: number;
  timestamp: Date;
  deviceId?: string;
}

// Device types
export interface Device {
  id: string;
  studentId: string;
  type: 'wearable' | 'phone';
  model?: string;
  lastSyncAt?: Date;
  isActive: boolean;
}

// Leaderboard types
export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  rank: number;
  classId: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}