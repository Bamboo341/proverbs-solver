// 段階3: バックトラッキング（docs/Spec.md 6.3）と伝播の不動点ループ
import { applyRulesOnce } from './rules.ts';
import { applySubsetOnce } from './propagation.ts';
import { EMPTY, FILLED, UNKNOWN } from './types.ts';
import type { Board, StateArray } from './types.ts';

// 確定ルール（＋制約伝播）を変化がなくなるまで適用する。
// 戻り値は矛盾を検出したヒントのインデックス（なければ -1）
export function propagate(board: Board, state: StateArray, useSubset: boolean): number {
  for (;;) {
    const r = applyRulesOnce(board, state);
    if (r.conflict >= 0) return r.conflict;
    if (r.changed) continue;
    if (!useSubset || !applySubsetOnce(board, state).changed) return -1;
    // サブセットルールで変化があったら、必ず確定ルールで検証し直す
  }
}

// 分岐セルの選択: 関与するヒント数が最大のセル。同点は走査順で最初（docs/Spec.md 6.3, 6.5）
function pickBranchCell(board: Board, state: StateArray): number {
  let best = -1;
  let bestCount = -1;
  for (let i = 0; i < board.n; i++) {
    if (state[i] !== UNKNOWN) continue;
    const count = board.cluesOfCell[i].length;
    if (count > bestCount) {
      best = i;
      bestCount = count;
    }
  }
  return best;
}

// 深さ優先探索で解を最大 limit 個 solutions に収集する。
// state は伝播済み・矛盾なしであること。仮定は filled → empty の順（docs/Spec.md 6.5）
export function search(
  board: Board,
  state: StateArray,
  useSubset: boolean,
  limit: number,
  solutions: StateArray[],
): void {
  if (solutions.length >= limit) return;
  const branch = pickBranchCell(board, state);
  if (branch < 0) {
    // 未確定セルなし＝全ヒント充足済み（伝播が矛盾なしで完了しているため）
    solutions.push(state.slice());
    return;
  }
  for (const guess of [FILLED, EMPTY]) {
    if (solutions.length >= limit) return;
    const next = state.slice();
    next[branch] = guess;
    if (propagate(board, next, useSubset) < 0) {
      search(board, next, useSubset, limit, solutions);
    }
  }
}
