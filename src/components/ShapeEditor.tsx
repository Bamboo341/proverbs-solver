// Step 1: ピース形状入力（docs/Spec.md 4.1, 4.4）
// テキストエリア（# と .）とグリッドの双方向同期、ドラッグ描画、
// 「内側を塗りつぶす」、グリッドサイズ変更、表示ズームを担う
import { useEffect, useRef, useState } from 'react';
import { enclosedCells } from '../state/reducer.ts';
import { posKey } from '../utils/coords.ts';
import { MAX_SIZE, parseShapeText, shapeToText } from '../utils/textArt.ts';
import GridView from './GridView.tsx';
import ZoomControl from './ZoomControl.tsx';
import type { CellPos, PieceShape } from '../solver/types.ts';

type PaintStroke = 'start' | 'continue';

type ShapeEditorProps = {
  shape: PieceShape;
  onLoadText: (text: string) => void;
  onPaintCell: (pos: CellPos, value: boolean, stroke: PaintStroke) => void;
  onFillEnclosed: () => void;
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
  onPaintCell,
  onFillEnclosed,
  onSetGridSize,
}: ShapeEditorProps) {
  // テキストエリアはフォーカス中は編集内容をそのまま保持し、
  // フォーカス外（グリッド操作・undo・プリセット読込）では shape から再生成する
  const [text, setText] = useState(() => shapeToText(shape));
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cellSize, setCellSize] = useState(20);

  // ドラッグ描画: 最初に触れたセルの反転結果をドラッグ中ずっと適用する
  const paintValue = useRef<boolean | null>(null);
  useEffect(() => {
    const endStroke = () => {
      paintValue.current = null;
    };
    window.addEventListener('mouseup', endStroke);
    return () => window.removeEventListener('mouseup', endStroke);
  }, []);

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

  const startPaint = (pos: CellPos) => {
    const value = !shape.cells.has(posKey(pos));
    paintValue.current = value;
    onPaintCell(pos, value, 'start');
  };
  const continuePaint = (pos: CellPos) => {
    if (paintValue.current !== null) onPaintCell(pos, paintValue.current, 'continue');
  };

  const enclosed = enclosedCells(shape);

  return (
    <div className="space-y-4">
      {/* グリッドサイズ（docs/Spec.md 4.1） */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
        <div className="flex items-center gap-2">
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
          <span className="text-xs text-gray-500">（各1〜{MAX_SIZE}）</span>
        </div>
        <ZoomControl value={cellSize} onChange={setCellSize} />
        <button
          type="button"
          onClick={onFillEnclosed}
          disabled={enclosed.size === 0}
          title="外枠で囲まれた内側の空マスを一括で有効セルにします"
          className="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
        >
          内側を塗りつぶす
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        {/* テキスト入力 */}
        <div className="space-y-1">
          <textarea
            value={text}
            spellCheck={false}
            wrap="off"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => handleTextChange(e.target.value)}
            className="h-64 w-80 resize rounded border border-gray-300 p-2 font-mono text-xs leading-tight"
            aria-label="形状テキスト入力"
          />
          <p className="text-xs text-gray-500"># = 有効セル / . = ピース外</p>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        {/* グリッド入力（クリック / ドラッグ） */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="max-w-full overflow-auto pb-1">
            <GridView
              shape={shape}
              outside="editable"
              cellSize={cellSize}
              onCellMouseDown={startPaint}
              onCellMouseEnter={continuePaint}
            />
          </div>
          <p className="text-xs text-gray-500">
            クリックで有効/無効を切り替え。ドラッグで連続入力（外枠を描いてから「内側を塗りつぶす」が便利です）
          </p>
        </div>
      </div>
    </div>
  );
}
