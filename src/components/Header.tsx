// ヘッダー: タイトル + Undo/Redo/Reset（docs/Spec.md 4.1）
// Undo/Redo ボタンの接続は Phase 7 で行う（ハンドラ未指定の間は無効表示）
type HeaderProps = {
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onReset: () => void;
};

const BUTTON_CLASS =
  'rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

export default function Header({
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onReset,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="text-xl font-bold">Proverbs ピースソルバー</h1>
        <div className="flex gap-2">
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
