import { EXP_TABLE, MAX_LEVEL } from '../data/expTable';
import type { JobProgress } from '../types/game';

export interface LevelUpResult {
  newLevel: number;
  newExp: number;
  leveledUp: boolean;
}

export function applyExp(job: JobProgress, gained: number): LevelUpResult {
  if (job.level >= MAX_LEVEL) {
    return { newLevel: job.level, newExp: job.currentExp, leveledUp: false };
  }

  let exp = job.currentExp + gained;
  let level = job.level;
  let leveledUp = false;

  while (level < MAX_LEVEL) {
    const expNeeded = EXP_TABLE[level]; // EXP_TABLE[level] = cumulative EXP to reach level+1
    if (exp >= expNeeded) {
      level++;
      leveledUp = true;
    } else {
      break;
    }
  }

  // Cap exp at max level threshold
  if (level >= MAX_LEVEL) {
    exp = EXP_TABLE[MAX_LEVEL - 1];
  }

  return { newLevel: level, newExp: exp, leveledUp };
}

export function expProgressPercent(job: JobProgress): number {
  if (job.level >= MAX_LEVEL) return 100;
  const currentLevelExp = EXP_TABLE[job.level - 1];
  const nextLevelExp = EXP_TABLE[job.level];
  const progress = job.currentExp - currentLevelExp;
  const needed = nextLevelExp - currentLevelExp;
  return Math.min(100, Math.round((progress / needed) * 100));
}

export function expToNext(job: JobProgress): number {
  if (job.level >= MAX_LEVEL) return 0;
  return EXP_TABLE[job.level] - job.currentExp;
}
