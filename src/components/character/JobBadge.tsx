import { getRankForLevel } from '../../data/jobs';
import type { JobType } from '../../types/game';

interface Props {
  jobType: JobType;
  level: number;
}

const JOB_STYLES: Record<JobType, string> = {
  warrior: 'bg-warrior-bg text-warrior border border-warrior-border',
  scholar: 'bg-scholar-bg text-scholar border border-scholar-border',
};

export function JobBadge({ jobType, level }: Props) {
  const rank = getRankForLevel(jobType, level);
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${JOB_STYLES[jobType]}`}
          style={{ fontFamily: 'Georgia, serif' }}>
      {rank.name}
    </span>
  );
}
