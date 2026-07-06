// ソルバーをCLIから実行する動作確認用スクリプト（docs/Spec.md 11 Phase 2）
// 使い方: npm run cli -- <problem.json> [--no-propagation]
import { readFileSync } from 'node:fs';
import { solve } from '../src/solver/solver.ts';
import { toProblem } from '../src/utils/problem.ts';
import type { ProblemData } from '../src/utils/problem.ts';
import { shapeToText, solutionToTextArt } from '../src/utils/textArt.ts';

const STATUS_LABELS = {
  solved: '解けました（一意解）',
  multiple_solutions: '複数解があります（最初に見つけた解を表示します）',
  no_solution: '解が存在しません',
} as const;

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith('--'));
if (!file) {
  console.error('使い方: npm run cli -- <problem.json> [--no-propagation]');
  process.exit(1);
}

try {
  const data = JSON.parse(readFileSync(file, 'utf8')) as ProblemData;
  const { shape, clues } = toProblem(data);
  const result = solve(shape, clues, { propagation: !args.includes('--no-propagation') });

  console.log(`問題: ${data.name ?? file}`);
  if (data.description) console.log(data.description);
  console.log('');
  console.log('形状:');
  console.log(shapeToText(shape));
  console.log('');
  console.log(`結果: ${STATUS_LABELS[result.status]}`);
  if (result.firstConflict) {
    console.log(`矛盾を検出したヒント位置: (${result.firstConflict.x}, ${result.firstConflict.y})`);
  }
  if (result.solution) {
    console.log('');
    console.log(solutionToTextArt(shape, clues, result.solution));
  }
} catch (err) {
  console.error(`エラー: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
