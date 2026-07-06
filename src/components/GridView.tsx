// 共通グリッドコンポーネント（docs/Spec.md 4.2 表示凡例）
// Step 1〜3 のすべてのグリッド表示で使い回す
import type { ReactNode } from 'react';
import { xyKey } from '../utils/coords.ts';
import type { CellPos, CellState, Clues, PieceShape, Solution } from '../solver/types.ts';

type GridViewProps = {
  shape: PieceShape;
  clues?: Clues;
  solution?: Solution | null;
  // 'editable': ピース外セルもクリック対象として薄く表示する（Step 1 の形状編集用）
  // 'hidden': ピース外は背景色のみ（Step 2/3 の表示用）
  outside?: 'hidden' | 'editable';
  selected?: CellPos | null; // 数値入力モードで選択中のセル（Step 2用）
  invalidClues?: Set<string>; // 近傍セル数超過の無効ヒント（赤枠表示）
  onCellClick?: (pos: CellPos) => void;
  onCellRightClick?: (pos: CellPos) => void;
};

export default function GridView({
  shape,
  clues,
  solution,
  outside = 'hidden',
  selected,
  invalidClues,
  onCellClick,
  onCellRightClick,
}: GridViewProps) {
  const cells: ReactNode[] = [];
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      const key = xyKey(x, y);
      const inPiece = shape.cells.has(key);
      const clue = inPiece ? clues?.get(key) : undefined;
      const state: CellState = inPiece ? (solution?.get(key) ?? 'unknown') : 'unknown';
      const clickable = onCellClick !== undefined && (inPiece || outside === 'editable');
      const isSelected = selected != null && selected.x === x && selected.y === y;
      const isInvalid = invalidClues?.has(key) ?? false;

      let className = 'relative flex h-7 w-7 items-center justify-center text-sm font-bold';
      let content: ReactNode = null;

      if (!inPiece) {
        // ピース外
        className += outside === 'editable' ? ' bg-gray-200/60' : ' bg-gray-50';
        if (clickable) className += ' hover:bg-blue-100';
      } else if (state === 'filled') {
        // 塗る: 黒マス（ヒントは白文字数字で両立表示）
        className += ' bg-gray-900 text-white';
        content = clue;
      } else if (state === 'empty') {
        // 塗らない: バツ印（ヒントは数字＋右上に小さな×）
        className += ' bg-white';
        content =
          clue !== undefined ? (
            <>
              <span className="text-gray-800">{clue}</span>
              <span className="absolute right-0.5 top-0 text-[9px] leading-none text-gray-400">
                ×
              </span>
            </>
          ) : (
            <span className="font-normal text-gray-400">×</span>
          );
      } else {
        // 未確定: 白マス（ヒントは数字のみ）
        className += ' bg-white text-gray-800';
        content = clue;
        if (clickable) className += ' hover:bg-blue-50';
      }
      // 選択中と無効が同時に成立するセルでは選択（青）を優先する
      // （両方のringクラスを付けると勝敗がCSS出力順に依存するため）
      if (isSelected) className += ' z-10 ring-2 ring-inset ring-blue-500';
      else if (isInvalid) className += ' z-10 ring-2 ring-inset ring-red-500';

      if (clickable) {
        cells.push(
          <button
            type="button"
            key={key}
            className={`${className} cursor-pointer`}
            onClick={() => onCellClick({ x, y })}
            onContextMenu={
              onCellRightClick &&
              ((e) => {
                e.preventDefault();
                onCellRightClick({ x, y });
              })
            }
          >
            {content}
          </button>,
        );
      } else {
        cells.push(
          <div key={key} className={className}>
            {content}
          </div>,
        );
      }
    }
  }

  return (
    <div
      className="inline-grid gap-px rounded border border-gray-300 bg-gray-300 p-px"
      style={{ gridTemplateColumns: `repeat(${shape.width}, 1.75rem)` }}
    >
      {cells}
    </div>
  );
}
