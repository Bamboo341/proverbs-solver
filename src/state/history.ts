// undo/redo の履歴管理（docs/Spec.md 5.2, 7章）
// すべてのユーザー操作アクションを履歴に記録する。UNDO/REDO 自体は記録しない
import { appReducer, createInitialState } from './reducer.ts';
import type { Action, AppState } from './types.ts';

export const HISTORY_LIMIT = 50;

export type HistoryState = {
  past: AppState[];
  present: AppState;
  future: AppState[];
};

export type HistoryAction = Action | { type: 'UNDO' } | { type: 'REDO' };

export function createInitialHistory(): HistoryState {
  return { past: [], present: createInitialState(), future: [] };
}

export function canUndo(state: HistoryState): boolean {
  return state.past.length > 0;
}

export function canRedo(state: HistoryState): boolean {
  return state.future.length > 0;
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case 'REDO': {
      if (state.future.length === 0) return state;
      const [next, ...rest] = state.future;
      return {
        past: [...state.past, state.present],
        present: next,
        future: rest,
      };
    }
    default: {
      const next = appReducer(state.present, action);
      if (next === state.present) return state; // 変化のない操作は履歴に積まない
      // ドラッグ描画の継続分は履歴を積まず、ドラッグ1回を1つのundo単位にまとめる
      if (action.type === 'PAINT_CELL' && action.stroke === 'continue') {
        return { past: state.past, present: next, future: [] };
      }
      const past = [...state.past, state.present];
      if (past.length > HISTORY_LIMIT) past.shift(); // 上限50件（docs/Spec.md 7.2）
      return { past, present: next, future: [] };
    }
  }
}
