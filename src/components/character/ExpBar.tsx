import { expProgressPercent, expToNext } from '../../utils/expCalc';
import type { JobProgress } from '../../types/game';
import { MAX_LEVEL } from '../../data/expTable';

interface Props {
  job: JobProgress;
}

export function ExpBar({ job }: Props) {
  const percent = expProgressPercent(job);
  const toNext = expToNext(job);
  const isMax = job.level >= MAX_LEVEL;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>EXP {job.currentExp}</span>
        <span>{isMax ? '已達滿級' : `距下一級 ${toNext} EXP`}</span>
      </div>
      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            background: 'linear-gradient(90deg, #c8a040, #f0c060)',
          }}
        />
      </div>
    </div>
  );
}
