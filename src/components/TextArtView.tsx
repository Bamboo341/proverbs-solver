// テキストアート表示（docs/Spec.md 4.1, 4.3）
// 日本語等幅フォントで桁を揃えて表示し、クリップボードへのコピーに対応する
import { useEffect, useRef, useState } from 'react';

type TextArtViewProps = {
  text: string;
  placeholder?: string; // text が空のときに表示する説明
};

export default function TextArtView({
  text,
  placeholder = '（表示する内容がありません）',
}: TextArtViewProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  if (!text) {
    return <div className="py-2 text-sm text-gray-400">{placeholder}</div>;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // クリップボードが使えない環境では何もしない
    }
  };

  return (
    <div className="relative inline-block min-w-52">
      <pre className="textart overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 pr-24 text-base">
        {text}
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
      >
        {copied ? 'コピーしました' : 'コピー'}
      </button>
    </div>
  );
}
