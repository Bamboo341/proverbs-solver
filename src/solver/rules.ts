// 段階1: 確定ルール（docs/Spec.md 6.1）と矛盾検出（6.4）
import { EMPTY, FILLED, UNKNOWN } from './types.ts';
import type { Board, StateArray } from './types.ts';

export type RulesResult = {
  changed: boolean;
  conflict: number; // 矛盾を検出したヒントのインデックス（なければ -1）
};

// 全ヒントにルールA/Bを1パス適用する。state を直接書き換える
export function applyRulesOnce(board: Board, state: StateArray): RulesResult {
  let changed = false;
  for (let ci = 0; ci < board.clues.length; ci++) {
    const clue = board.clues[ci];
    let filled = 0;
    let unknown = 0;
    for (const idx of clue.neighbors) {
      if (state[idx] === FILLED) filled++;
      else if (state[idx] === UNKNOWN) unknown++;
    }
    // 矛盾検出（docs/Spec.md 6.4）
    if (filled > clue.value || filled + unknown < clue.value) {
      return { changed, conflict: ci };
    }
    if (unknown === 0) continue;
    if (filled === clue.value) {
      // ルールA: 塗りが足りている → 残りはすべて空
      for (const idx of clue.neighbors) if (state[idx] === UNKNOWN) state[idx] = EMPTY;
      changed = true;
    } else if (filled + unknown === clue.value) {
      // ルールB: 未確定をすべて塗らないと足りない → 残りはすべて塗る
      for (const idx of clue.neighbors) if (state[idx] === UNKNOWN) state[idx] = FILLED;
      changed = true;
    }
  }
  return { changed, conflict: -1 };
}
