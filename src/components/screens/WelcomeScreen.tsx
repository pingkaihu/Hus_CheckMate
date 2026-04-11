import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { JOB_DEFINITIONS } from '../../data/jobs';
import type { JobType } from '../../types/game';

export function WelcomeScreen() {
  const { dispatch } = useGame();
  const [name, setName] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobType | null>(null);
  const [step, setStep] = useState<'name' | 'job'>('name');

  const handleNameSubmit = () => {
    if (name.trim().length === 0) return;
    setStep('job');
  };

  const handleStart = () => {
    if (!selectedJob || !name.trim()) return;
    dispatch({ type: 'INIT_CHARACTER', name: name.trim(), jobType: selectedJob });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-gray-950">
      {/* Logo / 標題 */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black tracking-tight text-yellow-400 mb-2">CheckMate</h1>
        <p className="text-gray-500 text-sm">打卡升級，成為你想要的自己</p>
      </div>

      <div className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-2xl p-7 shadow-2xl">
        {step === 'name' && (
          <div>
            <h2 className="text-lg font-bold text-white mb-1">你叫什麼名字？</h2>
            <p className="text-xs text-gray-500 mb-5">這將成為你的角色名稱</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              placeholder="輸入名稱..."
              maxLength={16}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500 transition-colors"
            />
            <button
              onClick={handleNameSubmit}
              disabled={name.trim().length === 0}
              className="mt-4 w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold transition-colors"
            >
              下一步
            </button>
          </div>
        )}

        {step === 'job' && (
          <div>
            <button
              onClick={() => setStep('name')}
              className="text-xs text-gray-500 hover:text-gray-300 mb-4 flex items-center gap-1"
            >
              ← 返回
            </button>
            <h2 className="text-lg font-bold text-white mb-1">選擇你的職業</h2>
            <p className="text-xs text-gray-500 mb-5">你可以之後解鎖另一個職業</p>

            <div className="flex flex-col gap-3">
              {(['warrior', 'scholar'] as JobType[]).map(jobType => {
                const def = JOB_DEFINITIONS[jobType];
                return (
                  <button
                    key={jobType}
                    onClick={() => setSelectedJob(jobType)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      selectedJob === jobType
                        ? jobType === 'warrior'
                          ? 'border-red-500 bg-red-900/30'
                          : 'border-blue-500 bg-blue-900/30'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-3xl">{def.emoji}</span>
                    <div>
                      <p className="font-bold text-white">{def.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{def.flavorText}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {def.ranks[0].name} → {def.ranks[def.ranks.length - 1].name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleStart}
              disabled={!selectedJob}
              className="mt-6 w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 font-bold transition-colors"
            >
              開始冒險
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
