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
    <div className="min-h-screen bg-gray-950 px-4 py-6 max-w-md mx-auto">
      {/* Navbar */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-black text-yellow-400 tracking-tight">CheckMate</h1>
          <p className="text-xs text-gray-500">{dateLabel} · {jobDef.emoji} {jobDef.label}路線</p>
        </div>
        <button
          onClick={() => setShowProfile(true)}
          className="w-9 h-9 rounded-full bg-gray-800 border border-gray-700 hover:border-yellow-600 flex items-center justify-center text-base transition-colors"
          aria-label="查看角色資料"
        >
          🧙
        </button>
      </div>

      {/* 角色卡片 */}
      <CharacterCard />

      {/* 任務列表 */}
      <TaskList />
    </div>
  );
}
