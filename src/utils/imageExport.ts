// 解答グリッドのPNG出力（docs/Spec.md 8章）
// Canvas APIのみで描画する（追加ライブラリなし）。
// 凡例はグリッド表示（4.2）と揃える: 塗る=黒塗り、塗らない=×、ヒント=数字、
// ピース外=グレー背景、グリッド線あり、タイトル/日時はオプション
import { xyKey } from './coords.ts';
import type { Clues, PieceShape, Solution } from '../solver/types.ts';

const CELL = 36; // 1セルの論理ピクセルサイズ
const MARGIN = 16; // 外周余白
const HEADER = 24; // タイトル行の高さ（タイトルがある場合のみ）
const SCALE = 2; // 高解像度出力用の倍率

const TITLE_FONT = 'bold 13px sans-serif';

export function renderSolutionCanvas(
  shape: PieceShape,
  clues: Clues,
  solution: Solution,
  options: { title?: string } = {},
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D コンテキストを取得できませんでした');

  // タイトルが小さいグリッドより長い場合はキャンバス幅を広げる
  // （canvasのサイズ変更で描画状態が消えるため、計測してからサイズを確定する）
  let titleWidth = 0;
  if (options.title) {
    ctx.font = TITLE_FONT;
    titleWidth = Math.ceil(ctx.measureText(options.title).width);
  }
  const headerH = options.title ? HEADER : 0;
  const width = Math.max(shape.width * CELL, titleWidth) + MARGIN * 2;
  const height = shape.height * CELL + MARGIN * 2 + headerH;
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  ctx.scale(SCALE, SCALE);

  // 全体の背景（ピース外を含む）
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, width, height);

  if (options.title) {
    ctx.fillStyle = '#374151';
    ctx.font = TITLE_FONT;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(options.title, MARGIN, MARGIN + HEADER / 2 - 4);
  }
  const gridTop = MARGIN + headerH;

  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      const key = xyKey(x, y);
      if (!shape.cells.has(key)) continue; // ピース外は背景のまま
      const px = MARGIN + x * CELL;
      const py = gridTop + y * CELL;
      const state = solution.get(key) ?? 'unknown';
      const clue = clues.get(key);

      // セル背景とグリッド線
      ctx.fillStyle = state === 'filled' ? '#111827' : '#ffffff';
      ctx.fillRect(px, py, CELL, CELL);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = px + CELL / 2;
      const cy = py + CELL / 2 + 1;

      if (state === 'filled') {
        // 塗る: 黒塗り（ヒントは白文字数字）
        if (clue !== undefined) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(String(clue), cx, cy);
        }
      } else if (state === 'empty') {
        if (clue !== undefined) {
          // 塗らないヒント: 数字＋右上に小さな×
          ctx.fillStyle = '#1f2937';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(String(clue), cx, cy);
          ctx.fillStyle = '#9ca3af';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'top';
          ctx.fillText('×', px + CELL - 3, py + 2);
        } else {
          // 塗らない: バツ印
          ctx.fillStyle = '#9ca3af';
          ctx.font = '16px sans-serif';
          ctx.fillText('×', cx, cy);
        }
      } else {
        // 未確定（通常は解答済みのみ出力するため現れない）
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(clue !== undefined ? String(clue) : '?', cx, cy);
      }
    }
  }
  return canvas;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}

// PNGとしてダウンロードする（docs/Spec.md 8.2）
export function downloadSolutionPng(
  shape: PieceShape,
  clues: Clues,
  solution: Solution,
  options: { title?: string } = {},
): void {
  const canvas = renderSolutionCanvas(shape, clues, solution, options);
  const link = document.createElement('a');
  link.download = `proverbs-solution-${timestamp()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
