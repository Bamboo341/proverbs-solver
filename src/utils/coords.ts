// "x,y" 文字列キー ↔ CellPos の変換ヘルパ（docs/Spec.md 5.1）
import type { CellPos } from '../solver/types.ts';

export function xyKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function posKey(pos: CellPos): string {
  return xyKey(pos.x, pos.y);
}

export function keyToPos(key: string): CellPos {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}
