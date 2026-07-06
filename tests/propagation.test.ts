// 段階2: 制約伝播（サブセットルール）のテスト（docs/Spec.md 6.2, 10.1）
import { describe, expect, it } from 'vitest';
import { applySubsetOnce } from '../src/solver/propagation.ts';
import { propagate } from '../src/solver/backtrack.ts';
import { buildBoard } from '../src/solver/solver.ts';
import { EMPTY, FILLED, UNKNOWN } from '../src/solver/types.ts';
import { makeProblem } from './helpers.ts';

// 1×4・全セルにヒント1。確定ルールだけでは1マスも確定しないが、
// サブセットルールで完全に解ける（解は #xx#）
const strip = () => makeProblem(['####'], { '0,0': 1, '1,0': 1, '2,0': 1, '3,0': 1 });

describe('制約伝播（段階2: サブセットルール）', () => {
  it('確定ルールのみでは停止する', () => {
    const { shape, clues } = strip();
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, false)).toBe(-1);
    expect([...state]).toEqual(Array(4).fill(UNKNOWN));
  });

  it('サブセットルール1回で unk(A)−unk(B) を確定できる', () => {
    const { shape, clues } = strip();
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(applySubsetOnce(board, state).changed).toBe(true);
    // unk(0,0) ⊆ unk(1,0) かつ rem が等しい → 差集合のセル (2,0) が empty
    expect(state[2]).toBe(EMPTY);
  });

  it('サブセットルール込みの伝播で探索なしに解けきる', () => {
    const { shape, clues } = strip();
    const board = buildBoard(shape, clues);
    const state = new Uint8Array(board.n);
    expect(propagate(board, state, true)).toBe(-1);
    expect([...state]).toEqual([FILLED, EMPTY, EMPTY, FILLED]);
  });
});
