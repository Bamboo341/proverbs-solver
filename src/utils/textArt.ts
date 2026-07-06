// テキストアート ↔ 内部形式の変換（docs/Spec.md 4.3）
import { xyKey } from './coords.ts';
import type { CellState, Clues, PieceShape, Solution } from '../solver/types.ts';

// グリッドの上限サイズ（docs/Spec.md 4.4）
export const MAX_SIZE = 80;

// 形状テキスト（'#'=有効セル、'.' または半角スペース=ピース外）→ PieceShape
// 末尾の空行のみ無視する。不正な入力は Error を投げる
export function parseShapeText(text: string): PieceShape {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop();
  if (lines.length === 0) throw new Error('形状テキストが空です');

  const height = lines.length;
  const width = Math.max(...lines.map((line) => line.length));
  if (width > MAX_SIZE || height > MAX_SIZE) {
    throw new Error(`グリッドは最大 ${MAX_SIZE}×${MAX_SIZE} です（入力: ${width}×${height}）`);
  }

  const cells = new Set<string>();
  lines.forEach((line, y) => {
    [...line].forEach((ch, x) => {
      if (ch === '#') cells.add(xyKey(x, y));
      else if (ch !== '.' && ch !== ' ') {
        throw new Error(`使用できない文字です: 「${ch}」（# と . のみ使用可）`);
      }
    });
  });
  if (cells.size === 0) throw new Error('有効セル（#）が1つもありません');

  return { width, height, cells };
}

// PieceShape → 形状テキスト（全行を width まで '.' で埋める）
export function shapeToText(shape: PieceShape): string {
  const rows: string[] = [];
  for (let y = 0; y < shape.height; y++) {
    let row = '';
    for (let x = 0; x < shape.width; x++) {
      row += shape.cells.has(xyKey(x, y)) ? '#' : '.';
    }
    rows.push(row);
  }
  return rows.join('\n');
}

// 解答テキストアートの文字（docs/Spec.md 4.3。1セル＝全角1文字幅）
const FILLED_DIGITS = [...'⓿❶❷❸❹❺❻❼❽❾']; // ヒント＋塗る
const EMPTY_DIGITS = [...'⓪①②③④⑤⑥⑦⑧⑨']; // ヒント＋塗らない
const UNKNOWN_DIGITS = [...'０１２３４５６７８９']; // ヒント＋未確定

// 解答 → テキストアート。solution に無いセルは未確定として描画する
export function solutionToTextArt(shape: PieceShape, clues: Clues, solution: Solution): string {
  const rows: string[] = [];
  for (let y = 0; y < shape.height; y++) {
    let row = '';
    for (let x = 0; x < shape.width; x++) {
      const key = xyKey(x, y);
      if (!shape.cells.has(key)) {
        row += '　'; // ピース外は全角スペース
        continue;
      }
      const state: CellState = solution.get(key) ?? 'unknown';
      const clue = clues.get(key);
      if (clue !== undefined) {
        const digits =
          state === 'filled' ? FILLED_DIGITS : state === 'empty' ? EMPTY_DIGITS : UNKNOWN_DIGITS;
        row += digits[clue];
      } else {
        row += state === 'filled' ? '■' : state === 'empty' ? '×' : '？';
      }
    }
    rows.push(row);
  }
  return rows.join('\n');
}
