import type { JobType } from '../types/game';

export interface JobRank {
  name: string;
  requiredLevel: number;
  description: string;
}

export interface JobDefinition {
  jobType: JobType;
  label: string;
  emoji: string;
  color: string; // Tailwind class fragment
  ranks: JobRank[];
  flavorText: string;
}

export const JOB_DEFINITIONS: Record<JobType, JobDefinition> = {
  warrior: {
    jobType: 'warrior',
    label: '戰士',
    emoji: '⚔️',
    color: 'warrior',
    flavorText: '以身體為武器，鍛鍊意志與肌肉。',
    ranks: [
      { name: '新手',     requiredLevel: 1,  description: '踏上戰士之路的起點。' },
      { name: '見習戰士', requiredLevel: 3,  description: '開始系統性訓練的菜鳥。' },
      { name: '戰士',     requiredLevel: 7,  description: '建立穩固運動習慣的中堅戰力。' },
      { name: '菁英戰士', requiredLevel: 12, description: '超越常人體能極限的精銳。' },
      { name: '戰鬥大師', requiredLevel: 20, description: '以鋼鐵意志成就的究極戰士。' },
    ],
  },
  scholar: {
    jobType: 'scholar',
    label: '學者',
    emoji: '📖',
    color: 'scholar',
    flavorText: '以知識為武器，探索智識的無垠疆域。',
    ranks: [
      { name: '新生',   requiredLevel: 1,  description: '渴望知識的入門者。' },
      { name: '學院生', requiredLevel: 3,  description: '建立學習習慣的學院新鮮人。' },
      { name: '學者',   requiredLevel: 7,  description: '持續深耕知識的研究者。' },
      { name: '研究者', requiredLevel: 12, description: '在專業領域有所建樹的探索者。' },
      { name: '賢者',   requiredLevel: 20, description: '以智慧照亮他人的學識巔峰。' },
    ],
  },
};

export function getRankForLevel(jobType: JobType, level: number): JobRank {
  const ranks = JOB_DEFINITIONS[jobType].ranks;
  let current = ranks[0];
  for (const rank of ranks) {
    if (level >= rank.requiredLevel) {
      current = rank;
    }
  }
  return current;
}
