// テスト共通ヘルパ
import { toProblem } from '../src/utils/problem.ts';
import type { CellState, Clues, PieceShape } from '../src/solver/types.ts';

export function makeProblem(
  shape: string[],
  clues: Record<string, number>,
): { shape: PieceShape; clues: Clues } {
  return toProblem({ id: 'test', name: 'test', shape, clues });
}

// 期待解の行形式（'#'=塗る, 'x'=塗らない, '.'=ピース外）→ "x,y" → CellState の Map
export function rowsToStates(rows: string[]): Map<string, CellState> {
  const map = new Map<string, CellState>();
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch === '#') map.set(`${x},${y}`, 'filled');
      else if (ch === 'x') map.set(`${x},${y}`, 'empty');
      else if (ch !== '.') throw new Error(`不正な期待解文字: ${ch}`);
    });
  });
  return map;
}
