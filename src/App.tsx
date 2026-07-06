// 1画面完結のレイアウト（docs/Spec.md 4.1）
// 状態は reducer + 履歴スタックで管理する
import { useEffect, useReducer } from 'react';
import ClueEditor from './components/ClueEditor.tsx';
import Header from './components/Header.tsx';
import ShapeEditor from './components/ShapeEditor.tsx';
import SolutionViewer from './components/SolutionViewer.tsx';
import { canRedo, canUndo, createInitialHistory, historyReducer } from './state/history.ts';
import { invalidClueKeys } from './state/reducer.ts';

function App() {
  const [history, dispatch] = useReducer(historyReducer, undefined, createInitialHistory);
  const state = history.present;

  const invalidClues = invalidClueKeys(state.shape, state.clues);
  const canSolve = state.shape.cells.size > 0 && invalidClues.size === 0;

  // キーボードショートカット（docs/Spec.md 4.4。Macキーバインドは対応不要: 同13章）
  // - Ctrl+Enter: 解く
  // - Ctrl+Z / Ctrl+Y: Undo / Redo
  //   （テキスト入力中はブラウザ標準のテキストundoを優先してスキップ）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key === 'Enter') {
        if (canSolve) {
          e.preventDefault();
          dispatch({ type: 'SOLVE' });
        }
        return;
      }
      const inTextField =
        e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement;
      if (inTextField) return;
      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [canSolve]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header
        canUndo={canUndo(history)}
        canRedo={canRedo(history)}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onReset={() => dispatch({ type: 'RESET' })}
      />
      <main className="mx-auto max-w-5xl space-y-6 p-6">
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">Step 1: ピース形状入力</h2>
          <ShapeEditor
            shape={state.shape}
            onLoadText={(text) => dispatch({ type: 'LOAD_TEXT_ART', text })}
            onToggleCell={(pos) => dispatch({ type: 'TOGGLE_CELL', pos })}
            onSetGridSize={(width, height) => dispatch({ type: 'SET_GRID_SIZE', width, height })}
          />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">Step 2: 数値ヒント入力</h2>
          <ClueEditor
            shape={state.shape}
            clues={state.clues}
            onSetClue={(pos, value) => dispatch({ type: 'SET_CLUE', pos, value })}
            onRemoveClue={(pos) => dispatch({ type: 'REMOVE_CLUE', pos })}
          />
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">Step 3: 解答</h2>
          <SolutionViewer
            shape={state.shape}
            clues={state.clues}
            solution={state.solution}
            solverStatus={state.solverStatus}
            firstConflict={state.firstConflict}
            invalidClues={invalidClues}
            onSolve={() => dispatch({ type: 'SOLVE' })}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
