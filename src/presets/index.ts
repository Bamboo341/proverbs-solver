// UIの「サンプル読込」用プリセット一覧（docs/Spec.md 4.1, 10.2）
// テスト（tests/solver.test.ts）も同じデータを検証に使う
import type { ProblemData } from '../utils/problem.ts';
import simple from './simple.json';
import propagation from './propagation.json';
import backtrack from './backtrack.json';

export const presets: ProblemData[] = [simple, propagation, backtrack];
