// 共通グリッドコンポーネント（docs/Spec.md 4.2 表示凡例）
// Step 1〜3 のすべてのグリッド表示で使い回す
import type { CSSProperties, ReactNode } from 'react';
import { xyKey } from '../utils/coords.ts';
import type { CellPos, CellState, Clues, PieceShape, Solution } from '../solver/types.ts';

// ピース輪郭線の色（indigo-600。docs/Spec.md 4.2）
const OUTLINE_BORDER = '2px solid #4f46e5';

export const DEFAULT_CELL_SIZE = 28;

type GridViewProps = {
  shape: PieceShape;
  clues?: Clues;
  solution?: Solution | null;
  // 'editable': ピース外セルもクリック対象として薄く表示する（Step 1 の形状編集用）
  // 'hidden': ピース外は背景色のみ（Step 2/3 の表示用）
  outside?: 'hidden' | 'editable';
  cellSize?: number; // セルの表示サイズpx（ズーム用）
  pieceTint?: boolean; // ピース内セルを薄い青で強調表示（Step 2用）
  outline?: boolean; // ピースの外周に色付き輪郭線を表示（Step 2/3用）
  selected?: CellPos | null; // 数値入力モードで選択中のセル（Step 2用）
  invalidClues?: Set<string>; // 近傍セル数超過の無効ヒント（赤枠表示）
  onCellClick?: (pos: CellPos) => void;
  onCellRightClick?: (pos: CellPos) => void;
  // ドラッグ描画用（Step 1）: 左ボタン押下で開始し、押したまま入ったセルに継続適用
  onCellMouseDown?: (pos: CellPos) => void;
  onCellMouseEnter?: (pos: CellPos) => void;
};

export default function GridView({
  shape,
  clues,
  solution,
  outside = 'hidden',
  cellSize = DEFAULT_CELL_SIZE,
  pieceTint = false,
  outline = false,
  selected,
  invalidClues,
  onCellClick,
  onCellRightClick,
  onCellMouseDown,
  onCellMouseEnter,
}: GridViewProps) {
  const interactive = onCellClick !== undefined || onCellMouseDown !== undefined;
  const fontSize = Math.max(9, Math.round(cellSize * 0.45));

  const cells: ReactNode[] = [];
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      const key = xyKey(x, y);
      const inPiece = shape.cells.has(key);
      const clue = inPiece ? clues?.get(key) : undefined;
      const state: CellState = inPiece ? (solution?.get(key) ?? 'unknown') : 'unknown';
      const clickable = interactive && (inPiece || outside === 'editable');
      const isSelected = selected != null && selected.x === x && selected.y === y;
      const isInvalid = invalidClues?.has(key) ?? false;

      let className = 'relative flex items-center justify-center font-bold';
      const style: CSSProperties = { width: cellSize, height: cellSize, fontSize };
      let content: ReactNode = null;

      if (!inPiece) {
        // ピース外
        className += outside === 'editable' ? ' bg-gray-200/70' : ' bg-gray-100';
        if (clickable) className += ' hover:bg-blue-100';
      } else if (state === 'filled') {
        // 塗る: 黒塗り（ヒントは白文字数字）
        className += ' bg-gray-900 text-white';
        content = clue;
      } else if (state === 'empty') {
        // 塗らない: 黄色塗り（ヒントは黒文字数字。docs/Spec.md 4.2）
        className += ' bg-amber-100 text-gray-900';
        content = clue;
      } else {
        // 未確定: 白マス（Step 2 では薄い青）。選択中は青塗りで区別する
        className += isSelected
          ? ' bg-blue-200 text-gray-900'
          : pieceTint
            ? ' bg-sky-100 text-gray-900'
            : ' bg-white text-gray-800';
        content = clue;
        if (clickable && !isSelected) {
          className += pieceTint ? ' hover:bg-sky-200' : ' hover:bg-blue-50';
        }
      }

      // ピースの輪郭線: ピース外と接する辺に色付きボーダー
      if (outline && inPiece) {
        if (!shape.cells.has(xyKey(x, y - 1))) style.borderTop = OUTLINE_BORDER;
        if (!shape.cells.has(xyKey(x, y + 1))) style.borderBottom = OUTLINE_BORDER;
        if (!shape.cells.has(xyKey(x - 1, y))) style.borderLeft = OUTLINE_BORDER;
        if (!shape.cells.has(xyKey(x + 1, y))) style.borderRight = OUTLINE_BORDER;
      }

      // 選択中と無効が同時のセルでは選択（青）を優先する
      if (isSelected) className += ' z-10 ring-2 ring-inset ring-blue-600';
      else if (isInvalid) className += ' z-10 ring-2 ring-inset ring-red-500';

      if (clickable) {
        cells.push(
          <button
            type="button"
            key={key}
            className={`${className} cursor-pointer`}
            style={style}
            onClick={onCellClick && (() => onCellClick({ x, y }))}
            onContextMenu={
              onCellRightClick &&
              ((e) => {
                e.preventDefault();
                onCellRightClick({ x, y });
              })
            }
            onMouseDown={
              onCellMouseDown &&
              ((e) => {
                if (e.button === 0) {
                  e.preventDefault(); // ドラッグ中のテキスト選択を防ぐ
                  onCellMouseDown({ x, y });
                }
              })
            }
            onMouseEnter={
              onCellMouseEnter &&
              ((e) => {
                if (e.buttons === 1) onCellMouseEnter({ x, y });
              })
            }
          >
            {content}
          </button>,
        );
      } else {
        cells.push(
          <div key={key} className={className} style={style}>
            {content}
          </div>,
        );
      }
    }
  }

  return (
    <div
      className="inline-grid select-none gap-px rounded border border-gray-300 bg-gray-300 p-px"
      style={{ gridTemplateColumns: `repeat(${shape.width}, ${cellSize}px)` }}
    >
      {cells}
    </div>
  );
}
