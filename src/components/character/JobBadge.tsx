import { getRankForLevel } from '../../data/jobs';
import type { JobType } from '../../types/game';

interface Props {
  jobType: JobType;
  level: number;
}

const JOB_COLORS: Record<JobType, string> = {
  warrior: 'bg-red-900/50 text-red-300 border border-red-700',
  scholar: 'bg-blue-900/50 text-blue-300 border border-blue-700',
};

export function JobBadge({ jobType, level }: Props) {
  const rank = getRankForLevel(jobType, level);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_COLORS[jobType]}`}>
      {rank.name}
    </span>
  );
}
