// 段階1: 確定ルールのテスト（docs/Spec.md 6.1, 6.4, 10.1）
import { describe, expect, it } from 'vitest';
import { applyRulesOnce } from '../src/solver/rules.ts';
import { propagate } from '../src/solver/backtrack.ts';
import { buildBoard } from '../src/solver/solver.ts';
import { EMPTY, FILLED, UNKNOWN } from '../src/solver/types.ts';
import { makeProblem } from './helpers.ts';

const full3x3 = ['###', '###', '###'];

describe('確定ルール（段階1）', () => {
  it('3×3 ヒント9 → 全セル塗り（ルールB）', () => {
    const { shape, clues } = makeProblem(full3x3, { '1,1': 9 });
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, false)).toBe(-1);
    expect([...state]).toEqual(Array(9).fill(FILLED));
  });

  it('3×3 ヒント0 → 全セル空き（ルールA）', () => {
    const { shape, clues } = makeProblem(full3x3, { '1,1': 0 });
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, false)).toBe(-1);
    expect([...state]).toEqual(Array(9).fill(EMPTY));
  });

  it('5×5 の中規模ケースを確定ルールだけで完全に解ける', () => {
    const { shape, clues } = makeProblem(
      ['#####', '#####', '#####', '#####', '#####'],
      { '4,0': 0, '1,1': 9, '3,3': 1, '0,4': 0 },
    );
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, false)).toBe(-1);
    expect([...state]).not.toContain(UNKNOWN);
    // 塗りは左上3×3ブロックの9セルのみ
    expect([...state].filter((v) => v === FILLED)).toHaveLength(9);
    expect(state[board.indexOf.get('2,2')!]).toBe(FILLED);
    expect(state[board.indexOf.get('3,2')!]).toBe(EMPTY);
  });

  it('矛盾を検出し、矛盾したヒントを報告する（filled > clue）', () => {
    // (0,0)=2 が両隣接セルの塗りを強制し、(1,0)=0 と矛盾する
    const { shape, clues } = makeProblem(['###'], { '0,0': 2, '1,0': 0 });
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    const conflict = propagate(board, state, false);
    expect(conflict).toBeGreaterThanOrEqual(0);
    expect(board.clues[conflict].pos).toEqual({ x: 1, y: 0 });
  });

  it('ヒント値が近傍セル数を超えると矛盾（filled + unknown < clue）', () => {
    const { shape, clues } = makeProblem(['##'], { '0,0': 3 });
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    const conflict = propagate(board, state, false);
    expect(conflict).toBeGreaterThanOrEqual(0);
    expect(board.clues[conflict].pos).toEqual({ x: 0, y: 0 });
  });

  it('確定できない場合は changed=false（1×2 ヒント1）', () => {
    const { shape, clues } = makeProblem(['##'], { '0,0': 1 });
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(applyRulesOnce(board, state)).toEqual({ changed: false, conflict: -1 });
    expect([...state]).toEqual([UNKNOWN, UNKNOWN]);
  });
});
