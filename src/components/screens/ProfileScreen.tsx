import { useGame } from '../../context/GameContext';
import { JOB_DEFINITIONS, getRankForLevel } from '../../data/jobs';
import { expProgressPercent } from '../../utils/expCalc';
import { ExpBar } from '../character/ExpBar';

interface Props {
  onClose: () => void;
}

export function ProfileScreen({ onClose }: Props) {
  const { state } = useGame();

  return (
    <div className="min-h-screen bg-parchment px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onClose}
          className="text-ink-pale hover:text-ink-faded transition-colors text-sm"
        >
          ← 返回
        </button>
        <h1 className="text-lg font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>
          英雄記錄
        </h1>
      </div>

      <div className="medieval-divider mb-5" />

      {/* 角色名稱 */}
      <div
        className="bg-parchment-card border border-border rounded-2xl p-5 mb-4 text-center"
        style={{ boxShadow: '0 2px 12px rgba(100,70,20,0.12)' }}
      >
        <div className="text-4xl mb-2">🧙</div>
        <h2 className="text-2xl font-black text-gold" style={{ fontFamily: 'Georgia, serif' }}>
          {state.characterName}
        </h2>
        <p className="text-xs text-ink-pale mt-1 italic">冒險者</p>
      </div>

      {/* 各職業狀態 */}
      {(['warrior', 'scholar'] as const).map(jobType => {
        const def = JOB_DEFINITIONS[jobType];
        const jobProgress = state.jobs.find(j => j.jobType === jobType);

        if (!jobProgress) {
          return (
            <div key={jobType} className="bg-parchment border border-border rounded-2xl p-5 mb-3 opacity-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl grayscale">{def.emoji}</span>
                <div>
                  <p className="font-bold text-ink-faded" style={{ fontFamily: 'Georgia, serif' }}>{def.label}</p>
                  <p className="text-xs text-ink-pale italic">尚未解鎖</p>
                </div>
              </div>
            </div>
          );
        }

        const rank = getRankForLevel(jobType, jobProgress.level);
        const percent = expProgressPercent(jobProgress);

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayCount = jobProgress.taskRecords.filter(r => r.completedAt === todayStr).length;
        const totalCount = jobProgress.taskRecords.length;

        const isActive = state.activeJob === jobType;

        return (
          <div
            key={jobType}
            className={`bg-parchment-card border-2 rounded-2xl p-5 mb-3 ${
              isActive ? 'border-gold' : 'border-border'
            }`}
            style={{ boxShadow: '0 2px 12px rgba(100,70,20,0.10)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <p className="font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>{def.label}</p>
                  <p className="text-xs text-ink-faded italic">{rank.name}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-ink" style={{ fontFamily: 'Georgia, serif' }}>
                  Lv.{jobProgress.level}
                </div>
                {isActive && (
                  <div className="text-xs text-gold font-medium">使用中</div>
                )}
              </div>
            </div>
            <ExpBar job={jobProgress} />
            <div className="mt-3 flex gap-4 text-xs text-ink-pale">
              <span>今日完成 {todayCount} 項</span>
              <span>累計完成 {totalCount} 項</span>
              <span>進度 {percent}%</span>
            </div>
          </div>
        );
      })}

      {/* 升級路線 */}
      <div
        className="bg-parchment-card border border-border rounded-2xl p-5 mt-2"
        style={{ boxShadow: '0 2px 12px rgba(100,70,20,0.10)' }}
      >
        <h3 className="text-sm font-bold text-ink-faded mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          ── 升級路線 ──
        </h3>
        {(['warrior', 'scholar'] as const).map(jobType => {
          const def = JOB_DEFINITIONS[jobType];
          return (
            <div key={jobType} className="mb-3">
              <p className="text-xs text-ink-faded mb-1 font-medium">{def.emoji} {def.label}</p>
              <div className="flex flex-wrap gap-1 items-center">
                {def.ranks.map((rank, i) => (
                  <span key={i} className="text-xs text-ink-pale">
                    {rank.name}
                    {i < def.ranks.length - 1 && <span className="text-border-dark mx-1">→</span>}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
