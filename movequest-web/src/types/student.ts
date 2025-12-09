export interface Student {
  id: string;
  name: string;
  stepsToday: number;
  totalPoints: number;
  level: number;
}

export interface ClassData {
  totalSteps: number;
  currentChallenge: string;
  stepLeader: string;
}