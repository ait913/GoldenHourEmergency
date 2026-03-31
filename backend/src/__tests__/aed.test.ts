/**
 * AED APIテスト
 * Spec: map-aed/03.5_test_plan.md — US-13, US-14, US-16
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { getTestServer } from '../test/server'
import { clearAedCache } from '../services/aed.service'

const server = getTestServer()

// Overpass APIモックレスポンス
const mockOverpassResponse = {
  elements: [
    {
      type: 'node',
      id: 1234567890,
      lat: 35.6812,
      lon: 139.7671,
      tags: {
        emergency: 'defibrillator',
        name: 'テストAED',
      },
    },
  ],
}

describe('GET /aed/nearby', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    clearAedCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    clearAedCache()
  })

  /** Spec: map-aed/03.5_test_plan.md — US-13 */
  it('近隣AEDが取得できる', async () => {
    // Arrange: Overpass APIをfetchモックで返す
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockOverpassResponse,
    } as Response)

    // When: GET /aed/nearby?lat=35.6762&lng=139.6503 を認証なしで送信
    const res = await request(server).get('/aed/nearby?lat=35.6762&lng=139.6503')

    // Then: ステータス200
    expect(res.status).toBe(200)
    // And: レスポンスに { aeds: [...] } が含まれる
    expect(res.body).toHaveProperty('aeds')
    expect(Array.isArray(res.body.aeds)).toBe(true)

    // And: aeds[0] の座標が正しい
    expect(res.body.aeds[0].lat).toBe(35.6812)
    expect(res.body.aeds[0].lng).toBe(139.7671)
    // And: name が "テストAED"
    expect(res.body.aeds[0].name).toBe('テストAED')
    // And: distance が数値
    expect(typeof res.body.aeds[0].distance).toBe('number')
  })

  /** Spec: map-aed/03.5_test_plan.md — US-14 */
  it('座標なしのリクエストは400エラー', async () => {
    // When: GET /aed/nearby（クエリパラメータなし）
    const res = await request(server).get('/aed/nearby')

    // Then: ステータス400
    expect(res.status).toBe(400)
    // And: { error: "lat and lng are required" }
    expect(res.body).toHaveProperty('error')
    expect(res.body.error).toBe('lat and lng are required')
  })

  /** Spec: map-aed/03.5_test_plan.md — US-14 (lngなし) */
  it('lngなしのリクエストは400エラー', async () => {
    // When: GET /aed/nearby?lat=35.6762（lngなし）
    const res = await request(server).get('/aed/nearby?lat=35.6762')

    // Then: ステータス400
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  /** Spec: map-aed/03.5_test_plan.md — US-16 */
  it('Overpass API 500エラー時にバックエンドがクラッシュしない', async () => {
    // Arrange: Overpass APIが500エラーを返すようにモック
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response)

    // When: GET /aed/nearby を送信
    const res = await request(server).get('/aed/nearby?lat=35.6762&lng=139.6503')

    // Then: バックエンドがクラッシュしない（200 or 502）
    expect([200, 502]).toContain(res.status)
    // And: 200の場合は { aeds: [] }
    if (res.status === 200) {
      expect(res.body).toHaveProperty('aeds')
      expect(res.body.aeds).toEqual([])
    }
    // And: 502の場合は { error: ... }
    if (res.status === 502) {
      expect(res.body).toHaveProperty('error')
    }
  })
})
