// 環境セットアップの確認用スモークテスト（Phase 2 で本来のソルバーテストに置き換える）
import { describe, expect, it } from 'vitest';

describe('環境セットアップ', () => {
  it('Vitest が動作する', () => {
    expect(1 + 1).toBe(2);
  });
});
