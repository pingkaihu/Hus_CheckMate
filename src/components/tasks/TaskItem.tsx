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
          ? 'bg-green-900/30 border-green-700 opacity-70'
          : 'bg-gray-800 border-gray-700 hover:border-yellow-600 hover:bg-gray-750'
      }`}
    >
      {/* Checkbox */}
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
          completed
            ? 'bg-green-500 border-green-500'
            : 'border-gray-500'
        }`}
      >
        {completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      {/* 內容 */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
      </div>

      {/* EXP 標籤 */}
      <div className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${
        completed ? 'bg-gray-700 text-gray-500' : 'bg-yellow-900/60 text-yellow-400'
      }`}>
        +{task.expReward} EXP
      </div>
    </button>
  );
}
