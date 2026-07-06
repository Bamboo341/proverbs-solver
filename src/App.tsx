// 1画面完結のレイアウト骨組み（docs/Spec.md 4.1）
// Step 1〜3 の入力UIは Phase 4〜6 で実装する。
// 状態は reducer + 履歴スタックで管理し、undo/redo のUI接続は Phase 7 で行う
import { useReducer } from 'react';
import ClueEditor from './components/ClueEditor.tsx';
import GridView from './components/GridView.tsx';
import Header from './components/Header.tsx';
import ShapeEditor from './components/ShapeEditor.tsx';
import TextArtView from './components/TextArtView.tsx';
import { createInitialHistory, historyReducer } from './state/history.ts';
import { solutionToTextArt } from './utils/textArt.ts';

function App() {
  const [history, dispatch] = useReducer(historyReducer, undefined, createInitialHistory);
  const state = history.present;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header onReset={() => dispatch({ type: 'RESET' })} />
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
          <button
            type="button"
            disabled
            className="mb-4 rounded bg-blue-600 px-4 py-1.5 text-sm font-bold text-white opacity-40"
            title="Phase 6 で実装"
          >
            解く
          </button>
          <div className="flex flex-wrap items-start gap-6">
            <GridView shape={state.shape} clues={state.clues} solution={state.solution} />
            <TextArtView
              text={
                state.solution ? solutionToTextArt(state.shape, state.clues, state.solution) : ''
              }
              placeholder="（解答はまだありません）"
            />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
