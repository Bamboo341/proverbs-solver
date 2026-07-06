// Step 1: ピース形状入力（docs/Spec.md 4.1, 4.4）
// テキストエリア（# と .）とグリッドクリックの双方向同期、グリッドサイズ変更を担う
import { useEffect, useState } from 'react';
import { MAX_SIZE, parseShapeText, shapeToText } from '../utils/textArt.ts';
import GridView from './GridView.tsx';
import type { CellPos, PieceShape } from '../solver/types.ts';

type ShapeEditorProps = {
  shape: PieceShape;
  onLoadText: (text: string) => void;
  onToggleCell: (pos: CellPos) => void;
  onSetGridSize: (width: number, height: number) => void;
};

// 数値入力を 1〜MAX_SIZE に丸める。空・非数値は null
function clampSize(raw: string): number | null {
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(MAX_SIZE, Math.max(1, n));
}

export default function ShapeEditor({
  shape,
  onLoadText,
  onToggleCell,
  onSetGridSize,
}: ShapeEditorProps) {
  // テキストエリアはフォーカス中は編集内容をそのまま保持し、
  // フォーカス外（グリッド操作・undo・プリセット読込）では shape から再生成する
  const [text, setText] = useState(() => shapeToText(shape));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!focused) {
      setText(shapeToText(shape));
      setError(null);
    }
  }, [shape, focused]);

  const handleTextChange = (value: string) => {
    setText(value);
    try {
      parseShapeText(value); // 検証のみ。成功時だけ反映する
      setError(null);
      onLoadText(value);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* グリッドサイズ（docs/Spec.md 4.1） */}
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">グリッドサイズ:</span>
        <label className="flex items-center gap-1">
          幅
          <input
            type="number"
            min={1}
            max={MAX_SIZE}
            value={shape.width}
            onChange={(e) => {
              const w = clampSize(e.target.value);
              if (w !== null) onSetGridSize(w, shape.height);
            }}
            className="w-16 rounded border border-gray-300 px-2 py-0.5"
          />
        </label>
        <span>×</span>
        <label className="flex items-center gap-1">
          高さ
          <input
            type="number"
            min={1}
            max={MAX_SIZE}
            value={shape.height}
            onChange={(e) => {
              const h = clampSize(e.target.value);
              if (h !== null) onSetGridSize(shape.width, h);
            }}
            className="w-16 rounded border border-gray-300 px-2 py-0.5"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* テキスト入力 */}
        <div className="space-y-1">
          <textarea
            value={text}
            spellCheck={false}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => handleTextChange(e.target.value)}
            className="h-52 w-56 resize-none rounded border border-gray-300 p-2 font-mono text-sm leading-tight"
            aria-label="形状テキスト入力"
          />
          <p className="text-xs text-gray-500"># = 有効セル / . = ピース外</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* グリッドクリック入力 */}
        <div className="space-y-1">
          <GridView shape={shape} outside="editable" onCellClick={onToggleCell} />
          <p className="text-xs text-gray-500">クリックで有効/無効を切り替え</p>
        </div>
      </div>
    </div>
  );
}
