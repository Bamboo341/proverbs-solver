// 段階2: 制約伝播＝サブセットルール（docs/Spec.md 6.2）
// 枝刈り最適化であり、解の正しさは段階1＋段階3で担保される
import { EMPTY, FILLED, UNKNOWN } from './types.ts';
import type { Board, StateArray } from './types.ts';

// サブセットルールを1回分適用する。
// unk(B) ⊆ unk(A) のとき（rem(X) = 値 − 塗り確定数）:
//   rem(A) − rem(B) == |unk(A) − unk(B)| → 差集合をすべて filled
//   rem(A) == rem(B)                     → 差集合をすべて empty
// 状態を書き換えたら即座に戻る（キャッシュした unk/rem が古くなるため、
// 再計算は呼び出し側の不動点ループに任せる）
export function applySubsetOnce(board: Board, state: StateArray): { changed: boolean } {
  const count = board.clues.length;
  const unks: number[][] = [];
  const rems: number[] = [];
  for (const clue of board.clues) {
    const unk: number[] = [];
    let filled = 0;
    for (const idx of clue.neighbors) {
      if (state[idx] === UNKNOWN) unk.push(idx);
      else if (state[idx] === FILLED) filled++;
    }
    unks.push(unk);
    rems.push(clue.value - filled);
  }
  for (let a = 0; a < count; a++) {
    const unkA = unks[a];
    if (unkA.length === 0) continue;
    const setA = new Set(unkA);
    for (let b = 0; b < count; b++) {
      if (a === b) continue;
      const unkB = unks[b];
      // 真部分集合のみ対象（等しい集合からは何も導けない）
      if (unkB.length === 0 || unkB.length >= unkA.length) continue;
      if (!unkB.every((idx) => setA.has(idx))) continue;
      const setB = new Set(unkB);
      const diff = unkA.filter((idx) => !setB.has(idx));
      if (rems[a] - rems[b] === diff.length) {
        for (const idx of diff) state[idx] = FILLED;
        return { changed: true };
      }
      if (rems[a] === rems[b]) {
        for (const idx of diff) state[idx] = EMPTY;
        return { changed: true };
      }
    }
  }
  return { changed: false };
}
