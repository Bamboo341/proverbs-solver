// ヘッダー: タイトル + サンプル読込 + Undo/Redo/Reset（docs/Spec.md 4.1）
import { presets } from '../presets/index.ts';

type HeaderProps = {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset: () => void;
  onLoadPreset?: (presetId: string) => void;
};

const BUTTON_CLASS =
  'rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

export default function Header({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
  onLoadPreset,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-3 shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Proverbs ピースソルバー</h1>
          <p className="text-xs text-gray-500">
            形状とヒントを入力して「解く」でパズルの解を計算します
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onLoadPreset && (
            // 値を常に "" に保つことで、同じプリセットを続けて選び直せる
            <select
              value=""
              onChange={(e) => e.target.value && onLoadPreset(e.target.value)}
              aria-label="サンプル読込"
              className="rounded border border-gray-300 bg-white px-2 py-1 text-sm hover:bg-gray-100"
            >
              <option value="" disabled>
                サンプル読込…
              </option>
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            className={BUTTON_CLASS}
            disabled={!canUndo || !onUndo}
            onClick={onUndo}
            title="元に戻す (Ctrl+Z)"
          >
            元に戻す
          </button>
          <button
            type="button"
            className={BUTTON_CLASS}
            disabled={!canRedo || !onRedo}
            onClick={onRedo}
            title="やり直す (Ctrl+Y)"
          >
            やり直す
          </button>
          <button type="button" className={BUTTON_CLASS} onClick={onReset}>
            リセット
          </button>
        </div>
      </div>
    </header>
  );
}
