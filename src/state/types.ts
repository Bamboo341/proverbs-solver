// アプリ状態とアクションの型定義（docs/Spec.md 5.1）
import type { CellPos, Clues, PieceShape, Solution } from '../solver/types.ts';

export type SolverStatus = 'idle' | 'solved' | 'no_solution' | 'multiple_solutions';

export type AppState = {
  shape: PieceShape;
  clues: Clues;
  solution: Solution | null;
  solverStatus: SolverStatus;
  firstConflict?: CellPos; // 直近の SOLVE で矛盾を検出したヒント位置（表示用）
};

export type Action =
  | { type: 'TOGGLE_CELL'; pos: CellPos }
  | { type: 'SET_CLUE'; pos: CellPos; value: number }
  | { type: 'REMOVE_CLUE'; pos: CellPos }
  | { type: 'SET_GRID_SIZE'; width: number; height: number }
  | { type: 'LOAD_TEXT_ART'; text: string }
  | { type: 'LOAD_PRESET'; presetId: string }
  | { type: 'SOLVE' }
  | { type: 'RESET' };
