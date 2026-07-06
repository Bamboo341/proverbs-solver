// ソルバー関連の型定義（docs/Spec.md 5.1 / 6章）

// セル座標
export type CellPos = { x: number; y: number };

// セル状態（解答）
export type CellState = 'filled' | 'empty' | 'unknown';

// ピース形状
export type PieceShape = {
  width: number; // グリッド（キャンバス）の幅。1〜20
  height: number; // グリッド（キャンバス）の高さ。1〜20
  cells: Set<string>; // "x,y" 形式。不変条件: 0 <= x < width, 0 <= y < height
};

// 数値ヒント（"x,y" → 値。ヒントは有効セル上にのみ置ける）
export type Clues = Map<string, number>;

// 解答（"x,y" → 状態）
export type Solution = Map<string, CellState>;

// ソルバーの実行結果（docs/Spec.md 5.1）
export type SolveResult = {
  status: 'solved' | 'multiple_solutions' | 'no_solution';
  solution: Solution | null; // no_solution のときは null
  firstConflict?: CellPos; // 仮定なしの伝播で最初に矛盾したヒント位置
};

// ---- 以下はソルバー内部表現 ----

// セル状態の数値表現（StateArray 用）。STATE_NAMES のインデックスと対応させること
export const UNKNOWN = 0;
export const FILLED = 1;
export const EMPTY = 2;
export const STATE_NAMES: readonly CellState[] = ['unknown', 'filled', 'empty'];

// 探索中の盤面状態。インデックスは Board.cellKeys に対応
export type StateArray = Uint8Array;

export type ClueEntry = {
  pos: CellPos;
  value: number;
  neighbors: number[]; // 3×3 ∩ ピース内のセルインデックス（行優先順）
};

// 前処理済みの盤面。走査順はすべて行優先（y昇順→x昇順、docs/Spec.md 6.5）
export type Board = {
  width: number;
  height: number;
  n: number; // 有効セル数
  cellKeys: string[]; // インデックス → "x,y"
  indexOf: Map<string, number>; // "x,y" → インデックス
  clues: ClueEntry[];
  cluesOfCell: number[][]; // セルインデックス → そのセルが関与するヒントのインデックス
};
