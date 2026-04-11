# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (Vite HMR)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint across all TS/TSX files
npm run preview    # Preview production build locally
```

There are no tests configured in this project.

## Architecture

**Hus CheckMate** is a gamified daily habit tracker. Users pick a job class (Warrior or Scholar), complete daily tasks, and earn EXP to level up — RPG-style. All state is persisted to `localStorage`; there is no backend.

### Data flow

```
src/data/         → Static config (tasks, job definitions, EXP table)
src/types/        → Shared TypeScript interfaces (GameState, Task, JobProgress…)
src/context/      → Global state via React Context + useReducer
  GameContext.tsx → Provider, hooks (useGame, useActiveJob, useCompletedTaskIds)
  gameReducer.ts  → Pure reducer handling all state transitions
src/utils/        → Pure helpers (EXP math, date string helpers)
src/components/   → UI, organized by domain (character/, tasks/, screens/)
App.tsx           → GameProvider wraps GameRouter, which shows WelcomeScreen or MainScreen
```

### Key state model (`src/types/game.ts`)

- `GameState` — top-level: character name, active job, list of `JobProgress`, last reset date.
- `JobProgress` — per-job level, cumulative EXP, and `TaskRecord[]` (completed task IDs + date).
- Daily reset is triggered automatically when `lastResetDate` differs from today (checked in `GameContext.tsx`).

### EXP system (`src/data/expTable.ts`, `src/utils/expCalc.ts`)

- `EXP_TABLE` is a 20-entry cumulative EXP array (index = level − 1). Max level is 20.
- `applyExp` handles multi-level-ups in one call. `expProgressPercent` and `expToNext` are used by UI components.

### Jobs and tasks (`src/data/`)

- Two job types: `warrior` (physical habits) and `scholar` (learning habits).
- `JOB_DEFINITIONS` holds rank names per job (5 rank thresholds per job).
- `TASKS` is a static array; `getAvailableTasks(jobType, level)` filters by job and `requiredLevel`.
- Tasks are always `type: 'daily'` — completing the same task again the next day is expected.

### Reducer actions (`src/context/gameReducer.ts`)

| Action | Effect |
|---|---|
| `INIT_CHARACTER` | Sets name, creates first job at Lv1 |
| `COMPLETE_TASK` | Adds TaskRecord + applies EXP (idempotent for same day) |
| `UNDO_TASK` | Removes TaskRecord + subtracts EXP |
| `SWITCH_JOB` | Changes activeJob; auto-creates JobProgress if new |
| `RESET_DAILY` | Updates `lastResetDate` to today (task records remain, filter by date handles the rest) |

### Styling

Tailwind CSS v4 via `@tailwindcss/vite` plugin (no `tailwind.config.js` needed). Job-specific color theming uses Tailwind class fragments stored in `JOB_DEFINITIONS[job].color` (`'warrior'` / `'scholar'`).
