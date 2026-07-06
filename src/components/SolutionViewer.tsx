// Step 3: 解答表示（docs/Spec.md 4.1, 4.4, 3.1）
// 解くボタンでソルバーを呼び、結果をグリッド＋テキストアートで表示する。
// 無効ヒントがある場合やセルが無い場合はボタンを無効化する（docs/Spec.md 4.4）
import { posKey } from '../utils/coords.ts';
import { solutionToTextArt } from '../utils/textArt.ts';
import GridView from './GridView.tsx';
import TextArtView from './TextArtView.tsx';
import type { CellPos, Clues, PieceShape, Solution } from '../solver/types.ts';
import type { SolverStatus } from '../state/types.ts';

type SolutionViewerProps = {
  shape: PieceShape;
  clues: Clues;
  solution: Solution | null;
  solverStatus: SolverStatus;
  firstConflict?: CellPos;
  invalidClues: Set<string>;
  onSolve: () => void;
};

// 解けなかった場合、テキストアートは未確定（？）で描画されるため、solution が
// あるときのみ表示する
function statusMessage(status: SolverStatus, firstConflict?: CellPos) {
  switch (status) {
    case 'solved':
      return { text: '解けました（一意解）。', tone: 'ok' as const };
    case 'multiple_solutions':
      return {
        text: '複数の解があります。最初に見つけた解を表示しています。',
        tone: 'warn' as const,
      };
    case 'no_solution':
      return {
        text: firstConflict
          ? `解が存在しません。ヒント (${firstConflict.x}, ${firstConflict.y}) で矛盾が生じています。`
          : '解が存在しません。ヒントを見直してください。',
        tone: 'error' as const,
      };
    default:
      return null;
  }
}

const TONE_CLASS = {
  ok: 'bg-green-50 text-green-800 border-green-300',
  warn: 'bg-amber-50 text-amber-800 border-amber-300',
  error: 'bg-red-50 text-red-700 border-red-300',
};

export default function SolutionViewer({
  shape,
  clues,
  solution,
  solverStatus,
  firstConflict,
  invalidClues,
  onSolve,
}: SolutionViewerProps) {
  const noCells = shape.cells.size === 0;
  const hasInvalid = invalidClues.size > 0;
  const canSolve = !noCells && !hasInvalid;

  const message = statusMessage(solverStatus, firstConflict);
  // 矛盾したヒントは解答グリッドで赤枠強調する
  const highlight = firstConflict ? new Set([posKey(firstConflict)]) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onSolve}
          disabled={!canSolve}
          className="rounded bg-blue-600 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-blue-600"
          title="解く (Ctrl+Enter)"
        >
          解く
        </button>
        {!canSolve && (
          <span className="text-sm text-gray-500">
            {noCells
              ? '先に形状とヒントを入力してください。'
              : '無効なヒント（赤枠）を修正してください。'}
          </span>
        )}
      </div>

      {message && (
        <div className={`rounded border px-3 py-2 text-sm ${TONE_CLASS[message.tone]}`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <GridView shape={shape} clues={clues} solution={solution} invalidClues={highlight} />
        <div>
          <div className="mb-1 text-xs text-gray-500">テキストアート</div>
          <TextArtView
            text={solution ? solutionToTextArt(shape, clues, solution) : ''}
            placeholder="（解答はまだありません。「解く」を押してください）"
          />
        </div>
      </div>
    </div>
  );
}
