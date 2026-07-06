// Step 2: 数値ヒント入力（docs/Spec.md 4.1, 4.4）
// セルをクリックで選択 → 数字キーまたはソフトウェアキーパッドで入力、
// Delete/右クリックで削除。近傍セル数を超える値は入力時に拒否して警告を表示する。
// ピース内セルは薄い青で常時強調し、ピースの輪郭に色付き枠線を表示する
import { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { invalidClueKeys, neighborCount } from '../state/reducer.ts';
import { posKey } from '../utils/coords.ts';
import GridView from './GridView.tsx';
import ZoomControl from './ZoomControl.tsx';
import type { CellPos, Clues, PieceShape } from '../solver/types.ts';

type ClueEditorProps = {
  shape: PieceShape;
  clues: Clues;
  onSetClue: (pos: CellPos, value: number) => void;
  onRemoveClue: (pos: CellPos) => void;
};

// ソフトウェアキーパッドの並び（電話配列風に 1〜9 → 0）
const KEYPAD_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

const KEYPAD_BUTTON_CLASS =
  'h-9 w-9 rounded border border-gray-300 bg-white text-base font-bold hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white';

export default function ClueEditor({ shape, clues, onSetClue, onRemoveClue }: ClueEditorProps) {
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [cellSize, setCellSize] = useState(32);

  // 選択中セルが形状変更で無効化されたら選択を解除する
  useEffect(() => {
    if (selected && !shape.cells.has(posKey(selected))) {
      setSelected(null);
      setWarning(null);
    }
  }, [shape, selected]);

  const invalid = invalidClueKeys(shape, clues);
  const max = selected ? neighborCount(shape, selected) : null;

  const selectCell = (pos: CellPos) => {
    setSelected(pos);
    setWarning(null);
  };

  const applyValue = (value: number) => {
    if (!selected) return;
    const limit = neighborCount(shape, selected);
    if (value > limit) {
      // 近傍セル数を超える値は拒否し、その場で警告（docs/Spec.md 4.4）
      setWarning(`${value} は入力できません。このセルの3×3範囲内のセルは ${limit} 個までです。`);
      return;
    }
    setWarning(null);
    onSetClue(selected, value);
  };

  const removeSelected = () => {
    if (!selected) return;
    setWarning(null);
    onRemoveClue(selected);
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (!selected) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      applyValue(Number(e.key));
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeSelected();
    }
  };

  const hasInvalid = invalid.size > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        色のついたマス（ピース内）をクリックして選択し、数字キーまたはキーパッドで入力。Delete
        または右クリックで削除。
      </p>
      <ZoomControl value={cellSize} onChange={setCellSize} />
      <div className="flex flex-wrap items-start gap-6">
        {/* onKeyDown はフォーカスされたセルボタンからバブリングで受け取る */}
        <div className="min-w-0 max-w-full overflow-auto pb-1" onKeyDown={handleKeyDown}>
          <GridView
            shape={shape}
            clues={clues}
            cellSize={cellSize}
            pieceTint
            outline
            selected={selected}
            invalidClues={invalid}
            onCellClick={selectCell}
            onCellRightClick={onRemoveClue}
          />
        </div>

        {/* ソフトウェアキーパッド（docs/Spec.md 4.4） */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500">
            {selected
              ? `選択中: (${selected.x}, ${selected.y}) — 入力できる値: 0〜${max}`
              : 'セルを選択するとキーパッドが使えます'}
          </div>
          <div className="grid w-fit grid-cols-5 gap-1">
            {KEYPAD_VALUES.map((v) => (
              <button
                key={v}
                type="button"
                className={KEYPAD_BUTTON_CLASS}
                disabled={!selected || (max !== null && v > max)}
                onClick={() => applyValue(v)}
              >
                {v}
              </button>
            ))}
            <button
              type="button"
              className="col-span-5 h-8 rounded border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
              disabled={!selected}
              onClick={removeSelected}
            >
              削除
            </button>
          </div>
        </div>
      </div>
      {warning && <p className="text-sm text-red-600">{warning}</p>}
      {hasInvalid && (
        <p className="text-sm text-red-600">
          赤枠のヒントは近傍セル数を超えています（形状変更が原因）。値を修正するか削除してください。
        </p>
      )}
      {shape.cells.size === 0 && (
        <p className="text-sm text-gray-400">先に Step 1 でピース形状を入力してください。</p>
      )}
    </div>
  );
}
