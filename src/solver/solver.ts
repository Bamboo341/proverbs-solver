// 統合ソルバー（docs/Spec.md 3.1 / 6章）
import { xyKey } from '../utils/coords.ts';
import { propagate, search } from './backtrack.ts';
import { STATE_NAMES } from './types.ts';
import type { Board, Clues, ClueEntry, PieceShape, Solution, SolveResult, StateArray } from './types.ts';

// 盤面の内部表現を構築する。走査順はすべて行優先（docs/Spec.md 6.5）
// 入力の不変条件違反（範囲外セル・ピース外/不正値のヒント）は Error を投げる
export function buildBoard(shape: PieceShape, clues: Clues): Board {
  const cellKeys: string[] = [];
  const indexOf = new Map<string, number>();
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      const key = xyKey(x, y);
      if (shape.cells.has(key)) {
        indexOf.set(key, cellKeys.length);
        cellKeys.push(key);
      }
    }
  }
  if (indexOf.size !== shape.cells.size) {
    throw new Error('ピース形状にグリッド範囲外のセルが含まれています');
  }

  const clueEntries: ClueEntry[] = [];
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      const value = clues.get(xyKey(x, y));
      if (value === undefined) continue;
      if (!indexOf.has(xyKey(x, y))) {
        throw new Error(`ヒント (${x},${y}) がピース外のセルに置かれています`);
      }
      if (!Number.isInteger(value) || value < 0 || value > 9) {
        throw new Error(`ヒント (${x},${y}) の値が不正です: ${value}（0〜9の整数のみ）`);
      }
      const neighbors: number[] = [];
      for (let ny = y - 1; ny <= y + 1; ny++) {
        for (let nx = x - 1; nx <= x + 1; nx++) {
          const idx = indexOf.get(xyKey(nx, ny));
          if (idx !== undefined) neighbors.push(idx);
        }
      }
      clueEntries.push({ pos: { x, y }, value, neighbors });
    }
  }
  if (clueEntries.length !== clues.size) {
    throw new Error('グリッド範囲外の位置にヒントがあります');
  }

  const cluesOfCell: number[][] = Array.from({ length: cellKeys.length }, () => []);
  clueEntries.forEach((clue, ci) => {
    for (const idx of clue.neighbors) cluesOfCell[idx].push(ci);
  });

  return {
    width: shape.width,
    height: shape.height,
    n: cellKeys.length,
    cellKeys,
    indexOf,
    clues: clueEntries,
    cluesOfCell,
  };
}

function toSolution(board: Board, state: StateArray): Solution {
  const solution: Solution = new Map();
  board.cellKeys.forEach((key, i) => {
    solution.set(key, STATE_NAMES[state[i]]);
  });
  return solution;
}

// ソルバー本体。options.propagation を false にすると段階2（サブセットルール）を
// 無効化する（差分テスト用。結果は変わらず速度のみ影響する: docs/Spec.md 6.2）
export function solve(
  shape: PieceShape,
  clues: Clues,
  options: { propagation?: boolean } = {},
): SolveResult {
  const useSubset = options.propagation !== false;
  const board = buildBoard(shape, clues);
  const state: StateArray = new Uint8Array(board.n);

  // 仮定なしの伝播。ここで矛盾したら firstConflict 付きで解なし（docs/Spec.md 6.4）
  const conflict = propagate(board, state, useSubset);
  if (conflict >= 0) {
    return { status: 'no_solution', solution: null, firstConflict: board.clues[conflict].pos };
  }

  // 複数解検出のため2つ目まで探索（docs/Spec.md 6.3）
  const solutions: StateArray[] = [];
  search(board, state, useSubset, 2, solutions);
  if (solutions.length === 0) {
    return { status: 'no_solution', solution: null };
  }
  return {
    status: solutions.length >= 2 ? 'multiple_solutions' : 'solved',
    solution: toSolution(board, solutions[0]),
  };
}
