// テキストアート変換のテスト（docs/Spec.md 4.3）
import { describe, expect, it } from 'vitest';
import { solve } from '../src/solver/solver.ts';
import { parseShapeText, shapeToText, solutionToTextArt } from '../src/utils/textArt.ts';
import { makeProblem } from './helpers.ts';

describe('parseShapeText', () => {
  it('# を有効セル、. と半角スペースをピース外として読む', () => {
    const shape = parseShapeText('.#\n #\n##');
    expect(shape.width).toBe(2);
    expect(shape.height).toBe(3);
    expect([...shape.cells].sort()).toEqual(['0,2', '1,0', '1,1', '1,2']);
  });

  it('行の長さが不揃いでも最長行を幅とする', () => {
    const shape = parseShapeText('##\n###');
    expect(shape.width).toBe(3);
    expect(shape.height).toBe(2);
    expect(shape.cells.size).toBe(5);
  });

  it('末尾の空行は無視する', () => {
    const shape = parseShapeText('##\n\n');
    expect(shape.height).toBe(1);
  });

  it('不正な文字はエラー', () => {
    expect(() => parseShapeText('#@#')).toThrow('使用できない文字');
  });

  it('空テキスト・有効セルなしはエラー', () => {
    expect(() => parseShapeText('')).toThrow('空です');
    expect(() => parseShapeText('...')).toThrow('有効セル');
  });

  it('80×80 を超えるとエラー', () => {
    expect(() => parseShapeText('#'.repeat(81))).toThrow('最大 80×80');
    expect(() => parseShapeText(Array(81).fill('#').join('\n'))).toThrow('最大 80×80');
    expect(parseShapeText('#'.repeat(80)).width).toBe(80);
  });
});

describe('shapeToText', () => {
  it('パース結果を書き戻すと同じ形状になる（幅まで . で埋める）', () => {
    const text = '.#.\n###\n..#';
    const shape = parseShapeText(text);
    expect(shapeToText(shape)).toBe(text);
    // 不揃いな入力も正規化されて往復できる
    const ragged = parseShapeText('##\n###');
    expect(shapeToText(ragged)).toBe('##.\n###');
    expect(parseShapeText(shapeToText(ragged)).cells).toEqual(ragged.cells);
  });
});

describe('solutionToTextArt', () => {
  it('ヒントセルは塗り状態に応じた数字1文字で表す（黒丸=塗る）', () => {
    const { shape, clues } = makeProblem(['###', '###', '###'], { '1,1': 9 });
    const result = solve(shape, clues);
    expect(solutionToTextArt(shape, clues, result.solution!)).toBe('■■■\n■❾■\n■■■');
  });

  it('塗らないセルは × 、塗らないヒントセルは白丸数字で表す', () => {
    const { shape, clues } = makeProblem(['###', '###', '###'], { '1,1': 0 });
    const result = solve(shape, clues);
    expect(solutionToTextArt(shape, clues, result.solution!)).toBe('×××\n×⓪×\n×××');
  });

  it('未確定は ？（ヒントセルは全角数字）、ピース外は全角スペースで表す', () => {
    const { shape, clues } = makeProblem(['.##'], { '1,0': 1 });
    // 解を渡さない＝全セル未確定として描画
    expect(solutionToTextArt(shape, clues, new Map())).toBe('　１？');
  });
});
