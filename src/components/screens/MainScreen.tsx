import { useState } from 'react';
import { CharacterCard } from '../character/CharacterCard';
import { TaskList } from '../tasks/TaskList';
import { ProfileScreen } from './ProfileScreen';
import { useGame } from '../../context/GameContext';
import { JOB_DEFINITIONS } from '../../data/jobs';

export function MainScreen() {
  const { state } = useGame();
  const [showProfile, setShowProfile] = useState(false);

  if (showProfile) {
    return <ProfileScreen onClose={() => setShowProfile(false)} />;
  }

  const jobDef = JOB_DEFINITIONS[state.activeJob];
  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}月${today.getDate()}日`;

  return (
    <div className="min-h-screen bg-parchment px-4 py-6 max-w-md mx-auto">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-gold tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
            ⚜️ CheckMate
          </h1>
          <p className="text-xs text-ink-pale italic">{dateLabel} · {jobDef.emoji} {jobDef.label}路線</p>
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 rounded-full border-2 border-border bg-parchment-card hover:border-border-dark flex items-center justify-center text-base transition-colors shadow-sm"
          style={{ boxShadow: '0 2px 6px rgba(100,70,20,0.15)' }}
          aria-label="查看角色資料"
        >
          🧙
        </button>
      </div>

      {/* 裝飾分隔線 */}
      <div className="medieval-divider mb-5" />

      {/* 角色卡片 */}
      <CharacterCard />

      {/* 任務列表 */}
      <TaskList />

      {/* 底部留白 */}
      <div className="h-8" />
    </div>
  );
}
