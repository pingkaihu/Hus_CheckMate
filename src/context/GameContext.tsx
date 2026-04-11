import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GameState, JobType } from '../types/game';
import { gameReducer } from './gameReducer';
import type { GameAction } from './gameReducer';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isNewDay } from '../utils/dateUtils';
import { MAX_LEVEL } from '../data/expTable';

const STORAGE_KEY = 'checkmate_save';

const VALID_JOB_TYPES = new Set(['warrior', 'scholar']);

/** Runtime guard: discard tampered or incompatible localStorage data */
function isSavedStateValid(v: unknown): v is GameState {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  if (typeof s.characterName !== 'string') return false;
  if (s.characterName.length > 32) return false;       // sanity cap
  if (!VALID_JOB_TYPES.has(s.activeJob as string)) return false;
  if (!Array.isArray(s.jobs)) return false;
  for (const job of s.jobs as unknown[]) {
    if (!job || typeof job !== 'object') return false;
    const j = job as Record<string, unknown>;
    if (!VALID_JOB_TYPES.has(j.jobType as string)) return false;
    if (typeof j.level !== 'number' || j.level < 1 || j.level > MAX_LEVEL) return false;
    if (typeof j.currentExp !== 'number' || j.currentExp < 0) return false;
    if (!Array.isArray(j.taskRecords)) return false;
  }
  return true;
}

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
  const validSaved = isSavedStateValid(saved) ? saved : null;

  const [state, dispatch] = useReducer(
    gameReducer,
    validSaved ?? DEFAULT_STATE,
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
