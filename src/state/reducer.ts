// メイン reducer（docs/Spec.md 5.2）
// - 形状・ヒントを変更するアクションは解答を自動クリアする
// - ヒントは有効セル上にのみ存在できる。無効セルとなった位置のヒントは
//   同一アクション内で削除する（1つのundo単位）
// - 変化がない場合は同じ state をそのまま返す（履歴に積まれない）
import { presets } from '../presets/index.ts';
import { solve } from '../solver/solver.ts';
import { keyToPos, posKey, xyKey } from '../utils/coords.ts';
import { toProblem } from '../utils/problem.ts';
import { MAX_SIZE, parseShapeText } from '../utils/textArt.ts';
import type { CellPos, Clues, PieceShape } from '../solver/types.ts';
import type { Action, AppState } from './types.ts';

export const INITIAL_SIZE = 10;

export function createInitialState(): AppState {
  return {
    shape: { width: INITIAL_SIZE, height: INITIAL_SIZE, cells: new Set() },
    clues: new Map(),
    solution: null,
    solverStatus: 'idle',
  };
}

// pos を中心とする3×3 ∩ ピース内のセル数（＝そのセルに置けるヒント値の上限）
export function neighborCount(shape: PieceShape, pos: CellPos): number {
  let count = 0;
  for (let y = pos.y - 1; y <= pos.y + 1; y++) {
    for (let x = pos.x - 1; x <= pos.x + 1; x++) {
      if (shape.cells.has(xyKey(x, y))) count++;
    }
  }
  return count;
}

// 値が近傍セル数を超えている無効ヒントの一覧。
// 入力時には拒否されるが、形状編集で後から生じ得る（docs/Spec.md 4.2, 4.4）
export function invalidClueKeys(shape: PieceShape, clues: Clues): Set<string> {
  const invalid = new Set<string>();
  for (const [key, value] of clues) {
    if (value > neighborCount(shape, keyToPos(key))) invalid.add(key);
  }
  return invalid;
}

// 無効セル上のヒントを取り除く。変化がなければ元の Map を返す
function pruneClues(clues: Clues, cells: Set<string>): Clues {
  let changed = false;
  const next: Clues = new Map();
  for (const [key, value] of clues) {
    if (cells.has(key)) next.set(key, value);
    else changed = true;
  }
  return changed ? next : clues;
}

// 形状/ヒント編集の共通後処理: 解答の自動クリア（docs/Spec.md 5.2)
function withEdit(state: AppState, changes: Partial<AppState>): AppState {
  return {
    ...state,
    solution: null,
    solverStatus: 'idle',
    firstConflict: undefined,
    ...changes,
  };
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'TOGGLE_CELL': {
      const { x, y } = action.pos;
      if (x < 0 || y < 0 || x >= state.shape.width || y >= state.shape.height) return state;
      const key = posKey(action.pos);
      const cells = new Set(state.shape.cells);
      let clues = state.clues;
      if (cells.has(key)) {
        cells.delete(key);
        if (clues.has(key)) {
          clues = new Map(clues);
          clues.delete(key); // セル無効化と同時にヒントも削除
        }
      } else {
        cells.add(key);
      }
      return withEdit(state, { shape: { ...state.shape, cells }, clues });
    }

    case 'SET_CLUE': {
      const key = posKey(action.pos);
      if (!state.shape.cells.has(key)) return state;
      if (!Number.isInteger(action.value) || action.value < 0 || action.value > 9) return state;
      // 近傍セル数を超える値は受け付けない（UI側で警告表示: docs/Spec.md 4.4）
      if (action.value > neighborCount(state.shape, action.pos)) return state;
      if (state.clues.get(key) === action.value) return state;
      const clues = new Map(state.clues);
      clues.set(key, action.value);
      return withEdit(state, { clues });
    }

    case 'REMOVE_CLUE': {
      const key = posKey(action.pos);
      if (!state.clues.has(key)) return state;
      const clues = new Map(state.clues);
      clues.delete(key);
      return withEdit(state, { clues });
    }

    case 'SET_GRID_SIZE': {
      const { width, height } = action;
      if (!Number.isInteger(width) || !Number.isInteger(height)) return state;
      if (width < 1 || height < 1 || width > MAX_SIZE || height > MAX_SIZE) return state;
      if (width === state.shape.width && height === state.shape.height) return state;
      const cells = new Set<string>();
      for (const key of state.shape.cells) {
        const pos = keyToPos(key);
        if (pos.x < width && pos.y < height) cells.add(key);
      }
      return withEdit(state, {
        shape: { width, height, cells },
        clues: pruneClues(state.clues, cells),
      });
    }

    case 'LOAD_TEXT_ART': {
      let shape: PieceShape;
      try {
        shape = parseShapeText(action.text);
      } catch {
        return state; // 入力の検証とエラー表示はUI側で行う
      }
      return withEdit(state, { shape, clues: pruneClues(state.clues, shape.cells) });
    }

    case 'LOAD_PRESET': {
      const preset = presets.find((p) => p.id === action.presetId);
      if (!preset) return state;
      const { shape, clues } = toProblem(preset);
      return withEdit(state, { shape, clues });
    }

    case 'SOLVE': {
      if (state.shape.cells.size === 0) return state;
      const result = solve(state.shape, state.clues);
      return {
        ...state,
        solution: result.solution,
        solverStatus: result.status,
        firstConflict: result.firstConflict,
      };
    }

    case 'RESET': {
      const initial = createInitialState();
      const alreadyInitial =
        state.shape.width === initial.shape.width &&
        state.shape.height === initial.shape.height &&
        state.shape.cells.size === 0 &&
        state.clues.size === 0 &&
        state.solution === null;
      return alreadyInitial ? state : initial;
    }
  }
}
