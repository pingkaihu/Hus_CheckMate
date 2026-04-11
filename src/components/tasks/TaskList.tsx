import { useState, useCallback } from 'react';
import { useGame, useActiveJob, useCompletedTaskIds } from '../../context/GameContext';
import { getAvailableTasks } from '../../data/tasks';
import { getRankForLevel } from '../../data/jobs';
import { TaskItem } from './TaskItem';
import { CompletionToast } from './CompletionToast';
import type { Task } from '../../types/game';
import { MAX_LEVEL } from '../../data/expTable';

export function TaskList() {
  const { state, dispatch } = useGame();
  const activeJob = useActiveJob();
  const completedIds = useCompletedTaskIds();
  const [toast, setToast] = useState<string | null>(null);

  const handleToggle = useCallback((task: Task, wasCompleted: boolean) => {
    if (wasCompleted) {
      dispatch({ type: 'UNDO_TASK', taskId: task.id, expReward: task.expReward });
    } else {
      dispatch({ type: 'COMPLETE_TASK', taskId: task.id, expReward: task.expReward });
      setToast(`✅ ${task.title} 完成！+${task.expReward} EXP`);
    }
  }, [dispatch]);

  if (!activeJob) return null;

  const tasks = getAvailableTasks(state.activeJob, activeJob.level);
  const completedCount = tasks.filter(t => completedIds.has(t.id)).length;
  const rank = getRankForLevel(state.activeJob, activeJob.level);

  return (
    <div className="mt-5">
      {/* 標題列 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-ink-faded tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>
          ── 今日任務 ──
        </h3>
        <span className="text-xs text-ink-pale">
          {completedCount} / {tasks.length} 完成
        </span>
      </div>

      {/* 滿級提示 */}
      {activeJob.level >= MAX_LEVEL && (
        <div className="mb-3 p-3 rounded-lg border border-border-dark bg-parchment-dark text-xs text-gold text-center italic">
          ✦ 汝已達{rank.name}之最高境界，願繼續精進！✦
        </div>
      )}

      {/* 任務列表 */}
      <div className="flex flex-col gap-2">
        {tasks.map(task => (
          <TaskItem
            key={task.id}
            task={task}
            completed={completedIds.has(task.id)}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <p className="text-center text-ink-pale text-sm py-8 italic">
          目前沒有可用任務
        </p>
      )}

      {/* Toast 通知 */}
      {toast && (
        <CompletionToast message={toast} onDone={() => setToast(null)} />
      )}
    </div>
  );
}
