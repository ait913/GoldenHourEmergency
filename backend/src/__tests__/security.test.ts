/**
 * 異常系・セキュリティテスト
 * Spec: 03.5_test_plan.md — US-12
 */
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { getTestServer } from '../test/server'
import { prisma } from '../prisma/client'
import { sign } from 'hono/jwt'

const server = getTestServer()

vi.mock('../services/sms.service', () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('../services/sse.service', () => ({
  notifyUser: vi.fn(),
  addClient: vi.fn(),
  removeClient: vi.fn(),
  getConnectedClients: vi.fn().mockReturnValue(new Map()),
}))

describe('POST /emergency (未認証)', () => {
  /** Spec: 03.5_test_plan.md — US-12 */
  it('Authorizationヘッダーなしで緊急通報を送信すると401が返る', async () => {
    const emergencyCountBefore = await prisma.emergency.count()

    // When: JWTトークンなしで POST /emergency を送信
    const res = await request(server).post('/emergency').send({
      lat: 35.6762,
      lng: 139.6503,
      symptoms: ['意識がない'],
    })

    // Then: ステータス401
    expect(res.status).toBe(401)

    // And: 緊急通報はDBに作成されない
    const emergencyCountAfter = await prisma.emergency.count()
    expect(emergencyCountAfter).toBe(emergencyCountBefore)
  })

  /** Spec: 03.5_test_plan.md — US-12 (期限切れJWT) */
  it('有効期限切れのJWTで緊急通報を送信すると401が返る', async () => {
    // Arrange: 期限切れのJWTを作成（exp: 過去時刻）
    const expiredToken = await sign(
      {
        userId: 9999,
        role: 'REPORTER',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1時間前
      } as Record<string, unknown>,
      process.env.JWT_SECRET || 'test-secret-key-for-testing-only'
    )

    // When: 期限切れJWTを使用して POST /emergency を送信
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${expiredToken}`)
      .send({
        lat: 35.6762,
        lng: 139.6503,
        symptoms: [],
      })

    // Then: ステータス401
    expect(res.status).toBe(401)
  })
})
