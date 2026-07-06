// サンプル問題/テストフィクスチャのJSON形式 → 内部形式の変換（docs/Spec.md 10.2）
import { parseShapeText } from './textArt.ts';
import type { Clues, PieceShape } from '../solver/types.ts';

// 問題JSONの形式。expected はテスト検証用（UIでは使用しない）
export type ProblemData = {
  id: string;
  name: string;
  description?: string;
  shape: string[]; // '#'（有効セル）と '.'（ピース外）の行の配列
  clues: Record<string, number>; // "x,y" → 値
  expected?: {
    status: string; // 'solved' | 'multiple_solutions' | 'no_solution'
    solution?: string[]; // '#'=塗る, 'x'=塗らない, '.'=ピース外
    firstConflict?: string; // "x,y"
  };
};

export function toProblem(data: ProblemData): { shape: PieceShape; clues: Clues } {
  if (!Array.isArray(data.shape) || data.shape.some((row) => typeof row !== 'string')) {
    throw new Error('問題JSONの shape は文字列の配列である必要があります');
  }
  if (typeof data.clues !== 'object' || data.clues === null) {
    throw new Error('問題JSONの clues はオブジェクトである必要があります');
  }
  const shape = parseShapeText(data.shape.join('\n'));
  const clues: Clues = new Map(Object.entries(data.clues));
  return { shape, clues };
}
