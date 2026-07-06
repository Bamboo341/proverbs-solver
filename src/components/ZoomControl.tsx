// グリッドの表示ズーム（セルサイズ調整）コントロール（docs/Spec.md 4.4）
type ZoomControlProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

const BUTTON_CLASS =
  'h-6 w-6 rounded border border-gray-300 bg-white text-sm leading-none hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white';

export default function ZoomControl({
  value,
  onChange,
  min = 12,
  max = 48,
  step = 4,
}: ZoomControlProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-500">
      <span>表示サイズ:</span>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label="縮小"
      >
        −
      </button>
      <span className="w-10 text-center">{value}px</span>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={() => onChange(Math.min(max, value + step))}
        disabled={value >= max}
        aria-label="拡大"
      >
        ＋
      </button>
    </div>
  );
}
