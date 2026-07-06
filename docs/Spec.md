# Proverbs ピースソルバー 実装仕様書

## 1. プロジェクト概要

### 1.1 目的
Steam版パズルゲーム「Proverbs」の1ピース単位のマインスイーパー系パズルを解くWebアプリケーション。ユーザーがピースの形状と数値ヒントを入力すると、システムが解を計算しテキストアートで表示する。

### 1.2 パズルのルール
- ピースは不規則な形状（有効セルの集合）で構成される
- 一部のセルには数値（0〜9）が書かれている
- 数値は「自セルを含む3×3範囲内で、塗るべきセル数」を示す
- 3×3範囲がピース外にはみ出す場合は、はみ出した分は無視（ピース内のセルだけカウント）
- 全ての数値制約を満たすように、各セルを「塗る」か「塗らない」か決定する

## 2. 技術スタック

| 項目 | 選択 |
|---|---|
| 言語 | TypeScript |
| フレームワーク | React |
| ビルドツール | Vite |
| スタイリング | Tailwind CSS（推奨） |
| 状態管理 | React標準（useState/useReducer）+ Context（必要に応じて） |
| テスト | Vitest（ソルバーロジックのユニットテスト用） |
| パッケージマネージャ | npm |

## 3. 機能要件

### 3.1 ソルバー機能（コア）
- **入力**: セル集合 + 数値ヒント辞書
- **処理**:
  1. 確定ルール適用（filled == clue → 残りは空、unknown + filled == clue → 残りは塗る）
  2. 制約伝播（複数ヒントの3×3範囲重なりから推論）
  3. バックトラッキング（1と2で解けない場合、仮定して探索）
- **出力**: 各セルの状態（塗る=1 / 塗らない=0）
- **解の一意性**: 複数解がある場合は最初に見つけた解を返し、警告フラグを立てる
- **矛盾検出**: 数値制約が矛盾する場合はエラーを返す

### 3.2 UI機能
1. 形状入力（テキストエリア + グリッドクリック両対応）
2. 数値ヒント入力（グリッドのセルをクリックして数値入力）
3. 解答表示（テキストアート + グリッドビュー）
4. undo/redo（操作単位）
5. 画像出力（PNG）

## 4. UI/UX 設計

### 4.1 画面構成
1画面完結型のシングルページ。上から順に以下のセクションを配置：

```
┌─────────────────────────────────────┐
│  ヘッダー（タイトル + Undo/Redo/Reset）  │
├─────────────────────────────────────┤
│  Step 1: ピース形状入力                │
│  ┌────────────┬────────────┐        │
│  │ テキスト入力 │ グリッド表示 │        │
│  │ (# と .)   │ (クリック編集)│        │
│  └────────────┴────────────┘        │
├─────────────────────────────────────┤
│  Step 2: 数値ヒント入力                │
│  グリッドのセルをクリック→数値入力       │
│  （右クリックで削除、キーボード0-9対応）  │
├─────────────────────────────────────┤
│  Step 3: 解答                         │
│  [解く] ボタン                        │
│  ┌────────────┬────────────┐        │
│  │ グリッド表示 │ テキストアート│        │
│  │            │ (コピー可能)  │        │
│  └────────────┴────────────┘        │
│  [PNG出力] ボタン                     │
└─────────────────────────────────────┘
```

Step 1〜3は縦に並列表示（切替なし）。上のステップの変更が下に即座に反映される。

### 4.2 表示凡例
- 有効セル（未確定）: 白マス `□`
- 塗るセル: 黒マス `■`
- 塗らないセル: バツ印 `×`
- 数値ヒント: 中央に数字を表示
- ピース外: 表示なし（背景色）
- カーソル/選択中: ハイライト

### 4.3 テキストアート仕様
- 形状入力/出力の記号：
  - `#` : 有効セル
  - `.` : ピース外
- 解答表示のテキストアート：
  - `■` : 塗る
  - `×` : 塗らない
  - `?` : 未確定（解けなかった場合）
  - `[数字]` : ヒント（数字1文字の場合は `[5]` のように括弧で囲む）
  - ピース外: 半角スペース2つ

### 4.4 操作性
- グリッドは最大 20×20 セル程度を想定（Proverbs実物に合わせて調整可）
- クリック操作:
  - Step 1: 左クリックで有効/無効トグル
  - Step 2: 左クリックで数値入力モードON、数字キーで入力、Deleteで削除
- キーボードショートカット:
  - Ctrl+Z / Ctrl+Y : Undo / Redo
  - Ctrl+Enter : 解く実行

## 5. データモデル

### 5.1 型定義（TypeScript）

```ts
// セル座標
type CellPos = { x: number; y: number };

// セル状態（解答）
type CellState = 'filled' | 'empty' | 'unknown';

// ピース形状
type PieceShape = {
  width: number;
  height: number;
  cells: Set<string>; // "x,y" 形式でSetに格納（座標のシリアライズ）
};

// 数値ヒント
type Clues = Map<string, number>; // "x,y" → 数値

// 解答
type Solution = Map<string, CellState>; // "x,y" → 状態

// アプリ全体の状態
type AppState = {
  shape: PieceShape;
  clues: Clues;
  solution: Solution | null;
  solverStatus: 'idle' | 'solving' | 'solved' | 'no_solution' | 'multiple_solutions' | 'contradiction';
};

// 履歴管理用アクション
type Action =
  | { type: 'TOGGLE_CELL'; pos: CellPos }
  | { type: 'SET_CLUE'; pos: CellPos; value: number }
  | { type: 'REMOVE_CLUE'; pos: CellPos }
  | { type: 'LOAD_TEXT_ART'; text: string }
  | { type: 'SOLVE' }
  | { type: 'RESET' };
```

### 5.2 状態管理
- `useReducer` でメイン状態を管理
- 履歴スタック（past / present / future）でundo/redo実装
- ソルバー呼び出しは同期実行だが、UIブロックを避けるため小さいピース想定でOK

## 6. ソルバーアルゴリズム詳細

### 6.1 段階1: 確定ルール
各ヒント `(cx, cy) = clue` について：
- `neighbors` = (cx, cy) を中心とする3×3範囲のうちピース内のセル
- `filled_count` = 塗り確定セル数
- `unknown_count` = 未確定セル数
- ルールA: `filled_count == clue` → 未確定セルはすべて `empty`
- ルールB: `filled_count + unknown_count == clue` → 未確定セルはすべて `filled`

変化がなくなるまで繰り返し。

### 6.2 段階2: 制約伝播
2つの重なり合うヒント A(cxA, cyA) と B(cxB, cyB) について：
- `neighborsA` と `neighborsB` の共通集合 `common` と差集合を計算
- `A_only = neighborsA - neighborsB`
- `B_only = neighborsB - neighborsA`
- 制約: `sum(A_only) + sum(common) == clueA - filledA_確定分`
- これらの線形制約から新たに確定できるセルを探す

シンプルには「Aのヒントを満たすために必要な塗りマスの上限/下限」を common に射影して B の制約と突き合わせる。

### 6.3 段階3: バックトラッキング
段階1・2で解けなかった場合：
1. 未確定セルの中から「制約に最も多く関わるセル」を選ぶ（最も制約の強いものから試すのが定石）
2. そのセルを `filled` と仮定して段階1・2を再実行
3. 矛盾したら `empty` と仮定して再実行
4. 両方矛盾したら親のバックトラック
5. 解が見つかったら、別解があるかも確認（複数解検出のため2つ目まで探索）

### 6.4 矛盾検出
どのタイミングでも以下をチェック：
- `filled_count > clue` → 矛盾
- `filled_count + unknown_count < clue` → 矛盾

## 7. undo/redo 仕様

### 7.1 対象
以下のユーザー操作をhistoryに記録：
- セルのON/OFFトグル
- 数値ヒントの追加/変更/削除
- テキストアート全体ロード
- 「解く」実行（解の状態変化を含む）
- リセット

### 7.2 実装方針
- immerを使うと状態のコピーが楽（推奨）
- history stack: `{ past: AppState[]; present: AppState; future: AppState[] }`
- 上限: 50件程度でOK
- Ctrl+Z / Ctrl+Y のキーバインド
- ボタンUIも用意

## 8. 画像出力機能

### 8.1 出力内容
解答済みグリッドをPNGとして出力：
- 塗るセル: 黒塗り
- 塗らないセル: バツ印
- ヒント: 数字
- ピース外: 透過またはグレー背景
- グリッド線あり
- タイトル/日時（オプション）

### 8.2 実装方針
- Canvas APIで描画してPNG化
- または `html-to-image` ライブラリでDOMをそのまま画像化
- ダウンロードボタンで保存

## 9. ファイル構成

```
proverbs-solver/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ShapeEditor.tsx        # Step 1: 形状入力
│   │   ├── ClueEditor.tsx         # Step 2: 数値入力
│   │   ├── SolutionViewer.tsx     # Step 3: 解答表示
│   │   ├── GridView.tsx           # 共通グリッドコンポーネント
│   │   └── TextArtView.tsx        # テキストアート表示
│   ├── solver/
│   │   ├── types.ts               # 型定義
│   │   ├── solver.ts              # メインソルバー
│   │   ├── rules.ts               # 確定ルール
│   │   ├── propagation.ts         # 制約伝播
│   │   └── backtrack.ts           # バックトラッキング
│   ├── state/
│   │   ├── reducer.ts             # useReducer 用
│   │   ├── history.ts             # undo/redo 管理
│   │   └── types.ts
│   ├── utils/
│   │   ├── textArt.ts             # テキストアート↔内部形式変換
│   │   ├── coords.ts              # "x,y" ↔ {x,y} 変換ヘルパ
│   │   └── imageExport.ts         # PNG出力
│   └── styles/
│       └── index.css
└── tests/
    ├── solver.test.ts             # ソルバーのユニットテスト
    ├── rules.test.ts
    └── fixtures/                  # サンプル問題
        ├── simple.json
        └── complex.json
```

## 10. テスト

### 10.1 ソルバーのユニットテスト（必須）
最低限、以下のケースをカバー：
- 単純な3×3全塗り（ヒント=9）
- 単純な3×3全空き（ヒント=0）
- 確定ルールで解ける中規模ケース（5×5）
- 制約伝播が必要なケース
- バックトラッキングが必要なケース
- 複数解のケース
- 矛盾ケース

### 10.2 サンプル問題
`tests/fixtures/` に JSON形式で複数保存し、READMEで解説。

## 11. 開発の進め方（推奨順序）

Claude Code に依頼する際は、以下の順序で段階的に実装するのがおすすめ：

1. **Phase 1: プロジェクト初期化**
   - Vite + React + TypeScript + Tailwind のセットアップ
   - 基本的なディレクトリ構成の作成

2. **Phase 2: ソルバーロジック単体**
   - 型定義（`solver/types.ts`）
   - 確定ルール（`solver/rules.ts`）+ テスト
   - 制約伝播（`solver/propagation.ts`）+ テスト
   - バックトラッキング（`solver/backtrack.ts`）+ テスト
   - 統合ソルバー（`solver/solver.ts`）+ テスト
   - **この時点でCLIから叩けるようにしてテスト通過を確認**

3. **Phase 3: UI基礎**
   - GridView コンポーネント
   - TextArtView コンポーネント
   - App の骨組み

4. **Phase 4: 形状入力（Step 1）**
   - テキストエリア入力
   - グリッドクリック入力
   - 両者の同期

5. **Phase 5: 数値ヒント入力（Step 2）**
   - グリッドクリック + 数字キー入力
   - 右クリック削除

6. **Phase 6: 解答表示（Step 3）**
   - ソルバー呼び出し
   - 結果表示
   - エラーハンドリング（矛盾/複数解）

7. **Phase 7: undo/redo**
   - 履歴管理reducer
   - キーボードショートカット + ボタン

8. **Phase 8: 画像出力**
   - Canvas描画
   - ダウンロード

9. **Phase 9: 仕上げ**
   - スタイリング調整
   - サンプル問題のプリセット
   - README作成

## 12. 受け入れ条件（Acceptance Criteria）

以下がすべて満たされていれば完成とする：

- [ ] `npm install && npm run dev` で起動できる
- [ ] `npm test` でソルバーのユニットテストが全て通る
- [ ] テキストアートでピース形状を入力できる
- [ ] グリッドクリックでピース形状を入力できる
- [ ] グリッドクリック+数字キーで数値ヒントを入力できる
- [ ] 「解く」ボタンで解答が表示される
- [ ] 解答がグリッドとテキストアート両方で表示される
- [ ] 解けないケース（矛盾/複数解）で適切なメッセージが出る
- [ ] Ctrl+Z / Ctrl+Y で undo/redo できる
- [ ] Undo/Redoボタンで undo/redo できる
- [ ] 解答をPNGでダウンロードできる
- [ ] サンプル問題を最低3つロードできる

## 13. 非機能要件・注意事項

- ソルバーはメインスレッド実行でOK（Proverbsの1ピースは高々20×20程度）
- ブラウザ対応は Chrome / Edge / Firefox 最新版のみ
- レスポンシブ対応は不要（デスクトップ利用想定）
- ライブラリは最小限に。追加提案する場合はコメントで理由を明記
- コメントは日本語でOK
- README.md には日本語で使い方を記載
