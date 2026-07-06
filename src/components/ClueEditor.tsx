// Step 2: 数値ヒント入力（docs/Spec.md 4.1, 4.4）
// セルをクリックで選択 → 数字キーで入力、Delete/右クリックで削除。
// 近傍セル数を超える値は入力時に拒否して警告を表示する
import { useEffect, useState } from 'react';
import { invalidClueKeys, neighborCount } from '../state/reducer.ts';
import { posKey } from '../utils/coords.ts';
import GridView from './GridView.tsx';
import type { CellPos, Clues, PieceShape } from '../solver/types.ts';

type ClueEditorProps = {
  shape: PieceShape;
  clues: Clues;
  onSetClue: (pos: CellPos, value: number) => void;
  onRemoveClue: (pos: CellPos) => void;
};

export default function ClueEditor({ shape, clues, onSetClue, onRemoveClue }: ClueEditorProps) {
  const [selected, setSelected] = useState<CellPos | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  // 選択中セルが形状変更で無効化されたら選択を解除する
  useEffect(() => {
    if (selected && !shape.cells.has(posKey(selected))) {
      setSelected(null);
      setWarning(null);
    }
  }, [shape, selected]);

  const invalid = invalidClueKeys(shape, clues);

  const selectCell = (pos: CellPos) => {
    setSelected(pos);
    setWarning(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selected) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      const value = Number(e.key);
      const max = neighborCount(shape, selected);
      if (value > max) {
        // 近傍セル数を超える値は拒否し、その場で警告（docs/Spec.md 4.4）
        setWarning(`${value} は入力できません。このセルの3×3範囲内のセルは ${max} 個までです。`);
        return;
      }
      setWarning(null);
      onSetClue(selected, value);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      setWarning(null);
      onRemoveClue(selected);
    }
  };

  const hasInvalid = invalid.size > 0;

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        セルをクリックして選択し、数字キー（0〜9）で入力。Delete または右クリックで削除。
      </p>
      {/* onKeyDown はフォーカスされたセルボタンからバブリングで受け取る */}
      <div className="inline-block" onKeyDown={handleKeyDown}>
        <GridView
          shape={shape}
          clues={clues}
          selected={selected}
          invalidClues={invalid}
          onCellClick={selectCell}
          onCellRightClick={onRemoveClue}
        />
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
