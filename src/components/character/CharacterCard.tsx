import { useGame, useActiveJob } from '../../context/GameContext';
import { JOB_DEFINITIONS } from '../../data/jobs';
import { ExpBar } from './ExpBar';
import { JobBadge } from './JobBadge';
import { MAX_LEVEL } from '../../data/expTable';

export function CharacterCard() {
  const { state, dispatch } = useGame();
  const activeJob = useActiveJob();

  if (!activeJob) return null;

  const jobDef = JOB_DEFINITIONS[state.activeJob];
  const otherJob: 'warrior' | 'scholar' = state.activeJob === 'warrior' ? 'scholar' : 'warrior';
  const otherDef = JOB_DEFINITIONS[otherJob];
  const otherJobProgress = state.jobs.find(j => j.jobType === otherJob);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 shadow-lg">
      {/* 角色名稱 + 職業切換 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-yellow-400">{state.characterName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{jobDef.emoji}</span>
            <JobBadge jobType={state.activeJob} level={activeJob.level} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">Lv.{activeJob.level}</div>
          {activeJob.level >= MAX_LEVEL && (
            <div className="text-xs text-yellow-400 font-medium">滿級</div>
          )}
        </div>
      </div>

      {/* EXP 條 */}
      <ExpBar job={activeJob} />

      {/* 切換職業 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <p className="text-xs text-gray-500 mb-2">切換職業</p>
        <button
          onClick={() => dispatch({ type: 'SWITCH_JOB', jobType: otherJob })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-sm text-gray-300 w-full"
        >
          <span>{otherDef.emoji}</span>
          <span>{otherDef.label}</span>
          {otherJobProgress && (
            <span className="ml-auto text-xs text-gray-500">Lv.{otherJobProgress.level}</span>
          )}
          {!otherJobProgress && (
            <span className="ml-auto text-xs text-green-500">解鎖新職業</span>
          )}
        </button>
      </div>
    </div>
  );
}
