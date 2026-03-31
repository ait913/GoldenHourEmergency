/**
 * AED APIクライアントのテスト
 * Spec: map-aed/03.5_test_plan.md — FE-09
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('aedApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  /** Spec: map-aed/03.5_test_plan.md — FE-09 */
  it('getNearby が正しいエンドポイントを呼ぶ', async () => {
    // Arrange: fetchをモック（{ aeds: [] } を返す）
    const mockFetch = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ aeds: [] }),
    } as Response)

    const { aedApi } = await import('@/lib/aed')

    // When: aedApi.getNearby(35.6762, 139.6503) を呼ぶ
    const result = await aedApi.getNearby(35.6762, 139.6503)

    // Then: fetch が "/aed/nearby?lat=35.6762&lng=139.6503" を含むURLに対して呼ばれる
    expect(mockFetch).toHaveBeenCalledOnce()
    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/aed/nearby?lat=35.6762&lng=139.6503')

    // And: Authorization ヘッダーが含まれない（認証不要エンドポイント）
    const calledInit = mockFetch.mock.calls[0][1] as RequestInit | undefined
    if (calledInit?.headers) {
      const headers = calledInit.headers as Record<string, string>
      expect(headers['Authorization']).toBeUndefined()
    }

    // And: 結果に aeds が含まれる
    expect(result).toHaveProperty('aeds')
  })
})
