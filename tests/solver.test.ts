// 統合ソルバーのテスト（docs/Spec.md 3.1, 6章, 10.1）
// プリセット/フィクスチャの期待結果検証と、制約伝播の差分テストを含む
import { describe, expect, it } from 'vitest';
import { presets } from '../src/presets/index.ts';
import { propagate } from '../src/solver/backtrack.ts';
import { buildBoard, solve } from '../src/solver/solver.ts';
import { UNKNOWN } from '../src/solver/types.ts';
import { toProblem } from '../src/utils/problem.ts';
import type { ProblemData } from '../src/utils/problem.ts';
import { makeProblem, rowsToStates } from './helpers.ts';
import multipleSolutions from './fixtures/multiple-solutions.json';
import noSolutionImmediate from './fixtures/no-solution-immediate.json';
import noSolutionSearch from './fixtures/no-solution-search.json';

const fixtures: ProblemData[] = [multipleSolutions, noSolutionImmediate, noSolutionSearch];
const allProblems: ProblemData[] = [...presets, ...fixtures];

describe('統合ソルバー', () => {
  it('3×3 ヒント9 → 全塗りで solved', () => {
    const { shape, clues } = makeProblem(['###', '###', '###'], { '1,1': 9 });
    const result = solve(shape, clues);
    expect(result.status).toBe('solved');
    expect(result.solution!.size).toBe(9);
    for (const state of result.solution!.values()) expect(state).toBe('filled');
  });

  it('3×3 ヒント0 → 全空きで solved', () => {
    const { shape, clues } = makeProblem(['###', '###', '###'], { '1,1': 0 });
    const result = solve(shape, clues);
    expect(result.status).toBe('solved');
    for (const state of result.solution!.values()) expect(state).toBe('empty');
  });

  it('ヒントセル自身も塗り対象になる（1×1 ヒント1、docs/Spec.md 1.2）', () => {
    const { shape, clues } = makeProblem(['#'], { '0,0': 1 });
    const result = solve(shape, clues);
    expect(result.status).toBe('solved');
    expect(result.solution!.get('0,0')).toBe('filled');
  });

  describe('プリセット/フィクスチャの期待結果', () => {
    for (const data of allProblems) {
      it(`${data.id} → ${data.expected!.status}`, () => {
        const { shape, clues } = toProblem(data);
        const result = solve(shape, clues);
        expect(result.status).toBe(data.expected!.status);
        if (data.expected!.solution) {
          const expected = rowsToStates(data.expected!.solution);
          expect(result.solution).not.toBeNull();
          expect(result.solution!.size).toBe(expected.size);
          for (const [key, state] of expected) {
            expect(result.solution!.get(key), `セル (${key})`).toBe(state);
          }
        }
        if (data.expected!.firstConflict) {
          const [x, y] = data.expected!.firstConflict.split(',').map(Number);
          expect(result.firstConflict).toEqual({ x, y });
        } else if (data.expected!.status === 'no_solution') {
          // 探索の結果の解なしには firstConflict を付けない（docs/Spec.md 6.4）
          expect(result.firstConflict).toBeUndefined();
        }
      });
    }
  });

  it('バックトラック用プリセットは伝播だけでは1マスも確定しない', () => {
    const data = presets.find((p) => p.id === 'backtrack')!;
    const { shape, clues } = toProblem(data);
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, true)).toBe(-1);
    expect([...state]).toEqual(Array(board.n).fill(UNKNOWN));
  });

  describe('差分テスト: 制約伝播の有無で結果が変わらない（docs/Spec.md 6.2, 10.1）', () => {
    // 伝播は枝刈りのみで結果に影響しないことの確認。
    // 複数解の場合の「最初の解」と firstConflict は伝播の強さに依存し得るため、
    // 内容比較は一意解（solved）のときのみ行う
    for (const data of allProblems) {
      it(data.id, () => {
        const { shape, clues } = toProblem(data);
        const withProp = solve(shape, clues);
        const withoutProp = solve(shape, clues, { propagation: false });
        expect(withoutProp.status).toBe(withProp.status);
        if (withProp.status === 'solved') {
          expect([...withoutProp.solution!.entries()]).toEqual([...withProp.solution!.entries()]);
        }
      });
    }
  });

  describe('入力検証', () => {
    it('ピース外のセルに置かれたヒントはエラー', () => {
      const { shape } = makeProblem(['#.'], {});
      expect(() => solve(shape, new Map([['1,0', 1]]))).toThrow('ピース外');
    });

    it('グリッド範囲外の位置のヒントはエラー', () => {
      const { shape } = makeProblem(['#'], {});
      expect(() => solve(shape, new Map([['5,5', 1]]))).toThrow('範囲外');
    });

    it('0〜9以外のヒント値はエラー', () => {
      const { shape } = makeProblem(['#'], {});
      expect(() => solve(shape, new Map([['0,0', 10]]))).toThrow('不正');
    });
  });
});
