/**
 * 位置情報系テスト
 * Spec: 03.5_test_plan.md — US-11
 */
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { getTestServer } from '../test/server'
import { prisma } from '../prisma/client'

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

const MEDICAL_PHONE = '+819033334444'

async function getMedicalToken(): Promise<{ token: string; userId: number }> {
  await request(server).post('/auth/send-otp').send({ phoneNumber: MEDICAL_PHONE })
  const { getStoredOtp } = await import('../services/auth.service')
  const otp = getStoredOtp(MEDICAL_PHONE)
  const res = await request(server).post('/auth/verify-otp').send({
    phoneNumber: MEDICAL_PHONE,
    otp,
    role: 'medical',
  })
  return { token: res.body.token as string, userId: res.body.user.id as number }
}

describe('PUT /location', () => {
  /** Spec: 03.5_test_plan.md — US-11 */
  it('医療従事者の位置情報を更新するとDBに保存される', async () => {
    // Arrange: 医療従事者として認証済みJWTを取得
    const { token, userId } = await getMedicalToken()

    const lat = 35.6762
    const lng = 139.6503

    // When: PUT /location に座標を送信
    const res = await request(server)
      .put('/location')
      .set('Authorization', `Bearer ${token}`)
      .send({ lat, lng })

    // Then: ステータス200
    expect(res.status).toBe(200)

    // And: DBのMedicalProfileに location が更新される（PostGIS）
    // rawSQLで確認
    const result = await prisma.$queryRaw<
      Array<{ lat: number; lng: number }>
    >`
      SELECT
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng
      FROM medical_profiles
      WHERE user_id = ${userId}
    `
    expect(result).toHaveLength(1)
    expect(result[0].lat).toBeCloseTo(lat, 4)
    expect(result[0].lng).toBeCloseTo(lng, 4)
  })

  /** Spec: 03.5_test_plan.md — US-11 (近隣検索での検出) */
  it('位置情報更新後、近隣検索で当該ユーザーが検出される', async () => {
    const { notifyUser } = await import('../services/sse.service')

    // Arrange: 医療従事者の位置を設定
    const { token: medToken, userId: medUserId } = await getMedicalToken()
    const NEARBY_LAT = 35.6842
    const NEARBY_LNG = 139.6503

    await request(server)
      .put('/location')
      .set('Authorization', `Bearer ${medToken}`)
      .send({ lat: NEARBY_LAT, lng: NEARBY_LNG })

    // 通報者でログイン
    const REPORTER_PHONE = '+819055556666'
    await request(server)
      .post('/auth/send-otp')
      .send({ phoneNumber: REPORTER_PHONE })
    const { getStoredOtp } = await import('../services/auth.service')
    const otp = getStoredOtp(REPORTER_PHONE)
    const reporterRes = await request(server).post('/auth/verify-otp').send({
      phoneNumber: REPORTER_PHONE,
      otp,
      role: 'reporter',
    })
    const reporterToken = reporterRes.body.token as string

    // When: 近隣（1km以内）の緊急通報を作成
    await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        lat: 35.6762,
        lng: 139.6503,
        symptoms: [],
      })

    // Then: 更新後に同座標での近隣検索で当該ユーザーが検出される
    const notifyCalls = (notifyUser as ReturnType<typeof vi.fn>).mock.calls
    const notifiedIds = notifyCalls.map((call) => call[0])
    expect(notifiedIds).toContain(medUserId)
  })
})
