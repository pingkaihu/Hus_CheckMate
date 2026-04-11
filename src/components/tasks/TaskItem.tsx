import type { Task } from '../../types/game';

interface Props {
  task: Task;
  completed: boolean;
  onToggle: (task: Task, completed: boolean) => void;
}

export function TaskItem({ task, completed, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(task, completed)}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 text-left ${
        completed
          ? 'bg-done-bg border-done opacity-70'
          : 'bg-parchment-card border-border hover:border-border-dark hover:bg-parchment'
      }`}
      style={{ boxShadow: completed ? 'none' : '0 1px 4px rgba(100,70,20,0.08)' }}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          completed
            ? 'border-done bg-done'
            : 'border-border bg-parchment'
        }`}
      >
        {completed && (
          <svg className="w-3 h-3 text-parchment-card" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${completed ? 'line-through text-ink-pale' : 'text-ink'}`}
           style={{ fontFamily: 'Georgia, serif' }}>
          {task.title}
        </p>
        <p className="text-xs text-ink-pale mt-0.5 italic">{task.description}</p>
      </div>

      {/* EXP 標籤 */}
      <div className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${
        completed
          ? 'bg-parchment border-border text-ink-pale'
          : 'bg-parchment border-border-dark text-gold'
      }`}>
        +{task.expReward} EXP
      </div>
    </button>
  );
}
