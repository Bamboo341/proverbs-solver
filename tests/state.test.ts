// reducer と履歴管理のテスト（docs/Spec.md 5.2, 7章）
import { describe, expect, it } from 'vitest';
import {
  HISTORY_LIMIT,
  canRedo,
  canUndo,
  createInitialHistory,
  historyReducer,
} from '../src/state/history.ts';
import type { HistoryAction, HistoryState } from '../src/state/history.ts';
import { invalidClueKeys, neighborCount } from '../src/state/reducer.ts';

function run(...actions: HistoryAction[]): HistoryState {
  return actions.reduce(historyReducer, createInitialHistory());
}

const toggle = (x: number, y: number): HistoryAction => ({ type: 'TOGGLE_CELL', pos: { x, y } });
const setClue = (x: number, y: number, value: number): HistoryAction => ({
  type: 'SET_CLUE',
  pos: { x, y },
  value,
});

describe('reducer: 形状編集', () => {
  it('TOGGLE_CELL でセルを追加/削除でき、編集で解答がクリアされる', () => {
    let s = run(toggle(0, 0));
    expect(s.present.shape.cells.has('0,0')).toBe(true);
    s = historyReducer(s, toggle(0, 0));
    expect(s.present.shape.cells.has('0,0')).toBe(false);
  });

  it('グリッド範囲外の TOGGLE_CELL は無視され履歴にも積まれない', () => {
    const s = run({ type: 'TOGGLE_CELL', pos: { x: 99, y: 0 } });
    expect(s.past).toHaveLength(0);
  });

  it('ヒント付きセルの無効化でヒントも同時に削除され、1つのundo単位になる', () => {
    const s = run(toggle(0, 0), setClue(0, 0, 1), toggle(0, 0));
    expect(s.present.clues.size).toBe(0);
    const undone = historyReducer(s, { type: 'UNDO' });
    expect(undone.present.shape.cells.has('0,0')).toBe(true);
    expect(undone.present.clues.get('0,0')).toBe(1);
  });

  it('SET_GRID_SIZE の縮小で範囲外のセルとヒントが削除される', () => {
    const s = run(toggle(5, 5), setClue(5, 5, 1), toggle(0, 0), {
      type: 'SET_GRID_SIZE',
      width: 5,
      height: 5,
    });
    expect(s.present.shape.width).toBe(5);
    expect(s.present.shape.cells.has('0,0')).toBe(true);
    expect(s.present.shape.cells.has('5,5')).toBe(false);
    expect(s.present.clues.size).toBe(0);
  });

  it('SET_GRID_SIZE の不正値・同値は無視される', () => {
    expect(run({ type: 'SET_GRID_SIZE', width: 0, height: 5 }).past).toHaveLength(0);
    expect(run({ type: 'SET_GRID_SIZE', width: 21, height: 5 }).past).toHaveLength(0);
    expect(run({ type: 'SET_GRID_SIZE', width: 10, height: 10 }).past).toHaveLength(0);
  });
});

describe('reducer: ヒント編集', () => {
  it('SET_CLUE / REMOVE_CLUE でヒントを設定・削除できる', () => {
    let s = run(toggle(0, 0), setClue(0, 0, 1));
    expect(s.present.clues.get('0,0')).toBe(1);
    s = historyReducer(s, { type: 'REMOVE_CLUE', pos: { x: 0, y: 0 } });
    expect(s.present.clues.size).toBe(0);
  });

  it('ピース外セルへの SET_CLUE は無視される', () => {
    const s = run(setClue(0, 0, 1));
    expect(s.past).toHaveLength(0);
  });

  it('近傍セル数を超える値は入力時に拒否される（docs/Spec.md 4.4）', () => {
    // セルが1つだけ → 近傍は1。値2は拒否、値1は受理
    const s = run(toggle(0, 0), setClue(0, 0, 2));
    expect(s.present.clues.size).toBe(0);
    const ok = historyReducer(s, setClue(0, 0, 1));
    expect(ok.present.clues.get('0,0')).toBe(1);
  });

  it('形状編集で無効になったヒントは invalidClueKeys で検出できる', () => {
    // 2セルでヒント2を置き、隣を無効化 → 近傍1 < 値2 で無効ヒントになる
    const s = run(toggle(0, 0), toggle(1, 0), setClue(0, 0, 2), toggle(1, 0));
    expect(s.present.clues.get('0,0')).toBe(2);
    expect(invalidClueKeys(s.present.shape, s.present.clues)).toEqual(new Set(['0,0']));
  });

  it('neighborCount は 3×3∩ピース内のセル数を返す', () => {
    const s = run(toggle(0, 0), toggle(1, 0), toggle(5, 5));
    expect(neighborCount(s.present.shape, { x: 0, y: 0 })).toBe(2);
    expect(neighborCount(s.present.shape, { x: 5, y: 5 })).toBe(1);
  });
});

describe('reducer: ロードとソルバー実行', () => {
  it('LOAD_TEXT_ART で形状を置換し、無効になったヒントだけ削除する', () => {
    const s = run(toggle(0, 0), toggle(5, 0), setClue(0, 0, 1), setClue(5, 0, 1), {
      type: 'LOAD_TEXT_ART',
      text: '##',
    });
    expect(s.present.shape.width).toBe(2);
    expect(s.present.shape.height).toBe(1);
    expect(s.present.clues.get('0,0')).toBe(1); // 有効なまま残るヒントは維持
    expect(s.present.clues.has('5,0')).toBe(false);
  });

  it('不正なテキストの LOAD_TEXT_ART は無視される', () => {
    expect(run({ type: 'LOAD_TEXT_ART', text: '@@' }).past).toHaveLength(0);
    expect(run({ type: 'LOAD_TEXT_ART', text: '...' }).past).toHaveLength(0);
  });

  it('LOAD_PRESET でプリセットを読み込める（未知IDは無視）', () => {
    const s = run({ type: 'LOAD_PRESET', presetId: 'simple' });
    expect(s.present.shape.width).toBe(5);
    expect(s.present.clues.size).toBe(4);
    expect(run({ type: 'LOAD_PRESET', presetId: 'unknown' }).past).toHaveLength(0);
  });

  it('SOLVE で解答が入り、形状/ヒント編集で自動クリアされる', () => {
    const s = run({ type: 'LOAD_PRESET', presetId: 'simple' }, { type: 'SOLVE' });
    expect(s.present.solverStatus).toBe('solved');
    expect(s.present.solution).not.toBeNull();
    const edited = historyReducer(s, toggle(0, 0));
    expect(edited.present.solution).toBeNull();
    expect(edited.present.solverStatus).toBe('idle');
  });

  it('矛盾する問題では no_solution と firstConflict が入る', () => {
    const s = run(
      toggle(0, 0),
      toggle(1, 0),
      toggle(2, 0),
      setClue(0, 0, 2),
      setClue(1, 0, 0),
      { type: 'SOLVE' },
    );
    expect(s.present.solverStatus).toBe('no_solution');
    expect(s.present.solution).toBeNull();
    expect(s.present.firstConflict).toEqual({ x: 1, y: 0 });
  });

  it('セルが1つもない状態の SOLVE は無視される', () => {
    expect(run({ type: 'SOLVE' }).past).toHaveLength(0);
  });
});

describe('履歴（undo/redo）', () => {
  it('UNDO / REDO で状態を行き来できる', () => {
    let s = run(toggle(0, 0), toggle(1, 0));
    expect(canUndo(s)).toBe(true);
    s = historyReducer(s, { type: 'UNDO' });
    expect(s.present.shape.cells.has('1,0')).toBe(false);
    expect(canRedo(s)).toBe(true);
    s = historyReducer(s, { type: 'REDO' });
    expect(s.present.shape.cells.has('1,0')).toBe(true);
  });

  it('UNDO 後の新しい編集で future がクリアされる', () => {
    let s = run(toggle(0, 0), toggle(1, 0));
    s = historyReducer(s, { type: 'UNDO' });
    s = historyReducer(s, toggle(2, 0));
    expect(canRedo(s)).toBe(false);
  });

  it('空の履歴での UNDO / REDO は何もしない', () => {
    const initial = createInitialHistory();
    expect(historyReducer(initial, { type: 'UNDO' })).toBe(initial);
    expect(historyReducer(initial, { type: 'REDO' })).toBe(initial);
  });

  it(`履歴の上限は ${HISTORY_LIMIT} 件`, () => {
    let s = createInitialHistory();
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) {
      s = historyReducer(s, toggle(i % 10, Math.floor(i / 10) % 10));
    }
    expect(s.past).toHaveLength(HISTORY_LIMIT);
  });

  it('RESET で初期状態に戻る。初期状態での RESET は履歴に積まれない', () => {
    const s = run(toggle(0, 0), { type: 'RESET' });
    expect(s.present.shape.cells.size).toBe(0);
    expect(s.past).toHaveLength(2);
    expect(run({ type: 'RESET' }).past).toHaveLength(0);
  });
});
