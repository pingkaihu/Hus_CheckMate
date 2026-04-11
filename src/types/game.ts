export type JobType = 'warrior' | 'scholar';

export type TaskType = 'daily';

export interface Task {
  id: string;
  jobType: JobType;
  title: string;
  description: string;
  expReward: number;
  requiredLevel: number;
  type: TaskType;
}

export interface TaskRecord {
  taskId: string;
  completedAt: string; // YYYY-MM-DD
}

export interface JobProgress {
  jobType: JobType;
  level: number;
  currentExp: number;
  unlockedAt: string;
  taskRecords: TaskRecord[];
}

export interface GameState {
  characterName: string;
  jobs: JobProgress[];
  activeJob: JobType;
  lastResetDate: string; // YYYY-MM-DD
}
