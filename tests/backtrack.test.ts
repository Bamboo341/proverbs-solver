// 段階3: バックトラッキングのテスト（docs/Spec.md 6.3, 6.5, 10.1）
import { describe, expect, it } from 'vitest';
import { propagate, search } from '../src/solver/backtrack.ts';
import { buildBoard } from '../src/solver/solver.ts';
import { EMPTY, FILLED } from '../src/solver/types.ts';
import type { StateArray } from '../src/solver/types.ts';
import { makeProblem } from './helpers.ts';

function searchAll(shape: string[], clues: Record<string, number>, limit = 2): StateArray[] {
  const problem = makeProblem(shape, clues);
  const board = buildBoard(problem.shape, problem.clues);
  const state = new Uint8Array(board.n);
  expect(propagate(board, state, true)).toBe(-1);
  const solutions: StateArray[] = [];
  search(board, state, true, limit, solutions);
  return solutions;
}

describe('バックトラッキング（段階3）', () => {
  it('複数解を2つ目まで探索し、filled を先に仮定する（1×2 ヒント1）', () => {
    const solutions = searchAll(['##'], { '0,0': 1 });
    expect(solutions).toHaveLength(2);
    expect([...solutions[0]]).toEqual([FILLED, EMPTY]);
    expect([...solutions[1]]).toEqual([EMPTY, FILLED]);
  });

  it('limit=1 では1つ見つけた時点で打ち切る', () => {
    const solutions = searchAll(['##'], { '0,0': 1 }, 1);
    expect(solutions).toHaveLength(1);
  });

  it('伝播が停止する一意解の問題を探索で解ける（3×3）', () => {
    // プリセット backtrack.json と同じ問題。伝播停止はsolver.test.tsで検証
    const solutions = searchAll(['###', '###', '###'], { '2,0': 3, '0,1': 1, '1,2': 1 });
    expect(solutions).toHaveLength(1);
  });

  it('探索を尽くして解なしを判定できる（2×2 ヒント2と3）', () => {
    const solutions = searchAll(['##', '##'], { '0,0': 2, '1,1': 3 });
    expect(solutions).toHaveLength(0);
  });
});
