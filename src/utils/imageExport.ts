// 解答グリッドのPNG出力（docs/Spec.md 8章）
// Canvas APIのみで描画する（追加ライブラリなし）。
// 凡例はグリッド表示（4.2）と揃える: 塗る=黒塗り、塗らない=黄色塗り、
// ヒント=数字（背景色が塗り状態を表す）、ピース外=グレー背景、
// グリッド線・ピース輪郭線あり、タイトル/日時はオプション
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

      // セル背景（2色塗り分け: 塗る=黒 / 塗らない=黄）とグリッド線
      ctx.fillStyle = state === 'filled' ? '#111827' : state === 'empty' ? '#fef3c7' : '#ffffff';
      ctx.fillRect(px, py, CELL, CELL);
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, CELL - 1, CELL - 1);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const cx = px + CELL / 2;
      const cy = py + CELL / 2 + 1;

      // ヒント数字: 塗る=白文字 / 塗らない=黒文字（背景色が塗り状態を表す）
      if (clue !== undefined) {
        ctx.fillStyle = state === 'filled' ? '#ffffff' : '#1f2937';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(String(clue), cx, cy);
      } else if (state === 'unknown') {
        // 未確定（通常は解答済みのみ出力するため現れない）
        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('?', cx, cy);
      }
    }
  }

  // ピースの輪郭線（画面表示と同じ indigo。docs/Spec.md 4.2）
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  for (let y = 0; y < shape.height; y++) {
    for (let x = 0; x < shape.width; x++) {
      if (!shape.cells.has(xyKey(x, y))) continue;
      const px = MARGIN + x * CELL;
      const py = gridTop + y * CELL;
      ctx.beginPath();
      if (!shape.cells.has(xyKey(x, y - 1))) {
        ctx.moveTo(px, py + 1);
        ctx.lineTo(px + CELL, py + 1);
      }
      if (!shape.cells.has(xyKey(x, y + 1))) {
        ctx.moveTo(px, py + CELL - 1);
        ctx.lineTo(px + CELL, py + CELL - 1);
      }
      if (!shape.cells.has(xyKey(x - 1, y))) {
        ctx.moveTo(px + 1, py);
        ctx.lineTo(px + 1, py + CELL);
      }
      if (!shape.cells.has(xyKey(x + 1, y))) {
        ctx.moveTo(px + CELL - 1, py);
        ctx.lineTo(px + CELL - 1, py + CELL);
      }
      ctx.stroke();
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
