import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GameState, JobType } from '../types/game';
import { gameReducer } from './gameReducer';
import type { GameAction } from './gameReducer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isNewDay } from '../utils/dateUtils';

const STORAGE_KEY = 'checkmate_save';

const DEFAULT_STATE: GameState = {
  characterName: '',
  jobs: [],
  activeJob: 'warrior',
  lastResetDate: '',
};

interface GameContextValue {
  state: GameState;
  dispatch: (action: GameAction) => void;
  isInitialized: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useLocalStorage<GameState | null>(STORAGE_KEY, null);

  const [state, dispatch] = useReducer(
    gameReducer,
    saved ?? DEFAULT_STATE,
  );

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    if (state.characterName) {
      setSaved(state);
    }
  }, [state, setSaved]);

  // Auto-reset daily tasks on new day
  useEffect(() => {
    if (state.characterName && state.lastResetDate && isNewDay(state.lastResetDate)) {
      dispatch({ type: 'RESET_DAILY' });
    }
  }, [state.characterName, state.lastResetDate]);

  const isInitialized = state.characterName.length > 0;

  const stableDispatch = useCallback((action: GameAction) => dispatch(action), []);

  return (
    <GameContext.Provider value={{ state, dispatch: stableDispatch, isInitialized }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export function useActiveJob() {
  const { state } = useGame();
  return state.jobs.find(j => j.jobType === state.activeJob) ?? null;
}

export function useCompletedTaskIds(): Set<string> {
  const { state } = useGame();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const activeJob = state.jobs.find(j => j.jobType === state.activeJob);
  if (!activeJob) return new Set();
  return new Set(
    activeJob.taskRecords
      .filter(r => r.completedAt === todayStr)
      .map(r => r.taskId),
  );
}
