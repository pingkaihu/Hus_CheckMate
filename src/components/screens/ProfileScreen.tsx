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
    <div className="min-h-screen bg-gray-950 px-4 py-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ← 返回
        </button>
        <h1 className="text-lg font-bold text-white">角色資料</h1>
      </div>

      {/* 角色名稱 */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-4 text-center">
        <div className="text-4xl mb-2">🧙</div>
        <h2 className="text-2xl font-black text-yellow-400">{state.characterName}</h2>
      </div>

      {/* 各職業狀態 */}
      {(['warrior', 'scholar'] as const).map(jobType => {
        const def = JOB_DEFINITIONS[jobType];
        const jobProgress = state.jobs.find(j => j.jobType === jobType);

        if (!jobProgress) {
          return (
            <div key={jobType} className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mb-3 opacity-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl grayscale">{def.emoji}</span>
                <div>
                  <p className="font-bold text-gray-500">{def.label}</p>
                  <p className="text-xs text-gray-600">尚未解鎖</p>
                </div>
              </div>
            </div>
          );
        }

        const rank = getRankForLevel(jobType, jobProgress.level);
        const percent = expProgressPercent(jobProgress);

        // 計算今日完成任務數
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const todayCount = jobProgress.taskRecords.filter(r => r.completedAt === todayStr).length;
        const totalCount = jobProgress.taskRecords.length;

        return (
          <div
            key={jobType}
            className={`bg-gray-900 border rounded-2xl p-5 mb-3 ${
              state.activeJob === jobType ? 'border-yellow-600' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{def.emoji}</span>
                <div>
                  <p className="font-bold text-white">{def.label}</p>
                  <p className="text-xs text-gray-400">{rank.name}</p>
                </div>
              </div>
              <div className="text-2xl font-black text-white">Lv.{jobProgress.level}</div>
            </div>
            <ExpBar job={jobProgress} />
            <div className="mt-3 flex gap-4 text-xs text-gray-500">
              <span>今日完成 {todayCount} 項</span>
              <span>累計完成 {totalCount} 項</span>
              <span>EXP 進度 {percent}%</span>
            </div>
          </div>
        );
      })}

      {/* 升級路線說明 */}
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 mt-2">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">升級路線</h3>
        {(['warrior', 'scholar'] as const).map(jobType => {
          const def = JOB_DEFINITIONS[jobType];
          return (
            <div key={jobType} className="mb-3">
              <p className="text-xs text-gray-500 mb-1">{def.emoji} {def.label}</p>
              <div className="flex flex-wrap gap-1">
                {def.ranks.map((rank, i) => (
                  <span key={i} className="text-xs text-gray-400">
                    {rank.name}
                    {i < def.ranks.length - 1 && <span className="text-gray-600 mx-1">→</span>}
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
