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
    <div
      className="bg-parchment-card border border-border rounded-2xl p-5"
      style={{ boxShadow: '0 4px 18px rgba(100,70,20,0.14), inset 0 1px 0 rgba(255,255,255,0.7)' }}
    >
      {/* 角色名稱 + 等級 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gold" style={{ fontFamily: 'Georgia, serif' }}>
            {state.characterName}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{jobDef.emoji}</span>
            <JobBadge jobType={state.activeJob} level={activeJob.level} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-ink" style={{ fontFamily: 'Georgia, serif' }}>
            Lv.{activeJob.level}
          </div>
          {activeJob.level >= MAX_LEVEL && (
            <div className="text-xs text-gold font-medium italic">滿級</div>
          )}
        </div>
      </div>

      {/* EXP 條 */}
      <ExpBar job={activeJob} />

      {/* 切換職業 */}
      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #c8a870' }}>
        <p className="text-xs text-ink-pale mb-2 italic">切換職業</p>
        <button
          onClick={() => dispatch({ type: 'SWITCH_JOB', jobType: otherJob })}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-parchment hover:border-border-dark hover:bg-parchment-dark transition-colors text-sm text-ink-faded w-full"
        >
          <span>{otherDef.emoji}</span>
          <span style={{ fontFamily: 'Georgia, serif' }}>{otherDef.label}</span>
          {otherJobProgress && (
            <span className="ml-auto text-xs text-ink-pale">Lv.{otherJobProgress.level}</span>
          )}
          {!otherJobProgress && (
            <span className="ml-auto text-xs text-gold font-medium">解鎖新職業 ✦</span>
          )}
        </button>
      </div>
    </div>
  );
}
