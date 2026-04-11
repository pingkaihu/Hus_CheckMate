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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-parchment-dark">
      {/* 標題 */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-3">⚜️</div>
        <h1 className="text-5xl font-black tracking-tight text-gold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
          CheckMate
        </h1>
        <div className="medieval-divider w-48 mx-auto my-3" />
        <p className="text-ink-pale text-sm italic">打卡升級，成為你想要的自己</p>
      </div>

      <div className="w-full max-w-sm bg-parchment-card border border-border rounded-2xl p-7 shadow-lg"
           style={{ boxShadow: '0 4px 24px rgba(100,70,20,0.15), inset 0 1px 0 rgba(255,255,255,0.6)' }}>
        {step === 'name' && (
          <div>
            <h2 className="text-lg font-bold text-ink mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              汝之名諱？
            </h2>
            <p className="text-xs text-ink-pale mb-5 italic">此名將刻於英雄記錄之上</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              placeholder="輸入名稱..."
              maxLength={16}
              className="w-full bg-parchment border border-border rounded-lg px-4 py-3 text-ink placeholder-ink-pale focus:outline-none focus:border-border-dark transition-colors"
              style={{ fontFamily: 'Georgia, serif' }}
            />
            <button
              onClick={handleNameSubmit}
              disabled={name.trim().length === 0}
              className="mt-4 w-full py-3 rounded-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-parchment-card"
              style={{ background: 'linear-gradient(180deg, #b8880a, #8b6010)', fontFamily: 'Georgia, serif' }}
            >
              下一步 →
            </button>
          </div>
        )}

        {step === 'job' && (
          <div>
            <button
              onClick={() => setStep('name')}
              className="text-xs text-ink-pale hover:text-ink-faded mb-4 flex items-center gap-1 transition-colors"
            >
              ← 返回
            </button>
            <h2 className="text-lg font-bold text-ink mb-1" style={{ fontFamily: 'Georgia, serif' }}>
              選擇爾之職業
            </h2>
            <p className="text-xs text-ink-pale mb-5 italic">另一職業可日後解鎖</p>

            <div className="flex flex-col gap-3">
              {(['warrior', 'scholar'] as JobType[]).map(jobType => {
                const def = JOB_DEFINITIONS[jobType];
                const isSelected = selectedJob === jobType;
                return (
                  <button
                    key={jobType}
                    onClick={() => setSelectedJob(jobType)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? jobType === 'warrior'
                          ? 'border-warrior bg-warrior-bg'
                          : 'border-scholar bg-scholar-bg'
                        : 'border-border bg-parchment hover:border-border-dark'
                    }`}
                  >
                    <span className="text-3xl">{def.emoji}</span>
                    <div>
                      <p className="font-bold text-ink" style={{ fontFamily: 'Georgia, serif' }}>{def.label}</p>
                      <p className="text-xs text-ink-faded mt-0.5 italic">{def.flavorText}</p>
                      <p className="text-xs text-ink-pale mt-1">
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
              className="mt-6 w-full py-3 rounded-lg font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-parchment-card"
              style={{ background: 'linear-gradient(180deg, #b8880a, #8b6010)', fontFamily: 'Georgia, serif' }}
            >
              ⚔️ 踏上旅途
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
