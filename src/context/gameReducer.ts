import type { GameState, JobType, JobProgress } from '../types/game';
import { applyExp } from '../utils/expCalc';
import { todayString } from '../utils/dateUtils';

export type GameAction =
  | { type: 'INIT_CHARACTER'; name: string; jobType: JobType }
  | { type: 'COMPLETE_TASK'; taskId: string; expReward: number }
  | { type: 'UNDO_TASK'; taskId: string; expReward: number }
  | { type: 'SWITCH_JOB'; jobType: JobType }
  | { type: 'RESET_DAILY' };

function makeNewJob(jobType: JobType): JobProgress {
  return {
    jobType,
    level: 1,
    currentExp: 0,
    unlockedAt: todayString(),
    taskRecords: [],
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'INIT_CHARACTER': {
      return {
        characterName: action.name.trim(),
        jobs: [makeNewJob(action.jobType)],
        activeJob: action.jobType,
        lastResetDate: todayString(),
      };
    }

    case 'COMPLETE_TASK': {
      const today = todayString();
      return {
        ...state,
        jobs: state.jobs.map(job => {
          if (job.jobType !== state.activeJob) return job;
          // Prevent double-completion
          const alreadyDone = job.taskRecords.some(
            r => r.taskId === action.taskId && r.completedAt === today,
          );
          if (alreadyDone) return job;
          const { newLevel, newExp } = applyExp(job, action.expReward);
          return {
            ...job,
            level: newLevel,
            currentExp: newExp,
            taskRecords: [...job.taskRecords, { taskId: action.taskId, completedAt: today }],
          };
        }),
      };
    }

    case 'UNDO_TASK': {
      const today = todayString();
      return {
        ...state,
        jobs: state.jobs.map(job => {
          if (job.jobType !== state.activeJob) return job;
          const wasCompleted = job.taskRecords.some(
            r => r.taskId === action.taskId && r.completedAt === today,
          );
          if (!wasCompleted) return job;
          const { newLevel, newExp } = applyExp(
            { ...job, currentExp: Math.max(0, job.currentExp - action.expReward) },
            0,
          );
          return {
            ...job,
            level: newLevel,
            currentExp: Math.max(0, job.currentExp - action.expReward),
            taskRecords: job.taskRecords.filter(
              r => !(r.taskId === action.taskId && r.completedAt === today),
            ),
          };
        }),
      };
    }

    case 'SWITCH_JOB': {
      const exists = state.jobs.some(j => j.jobType === action.jobType);
      return {
        ...state,
        activeJob: action.jobType,
        jobs: exists ? state.jobs : [...state.jobs, makeNewJob(action.jobType)],
      };
    }

    case 'RESET_DAILY': {
      return { ...state, lastResetDate: todayString() };
    }

    default:
      return state;
  }
}
