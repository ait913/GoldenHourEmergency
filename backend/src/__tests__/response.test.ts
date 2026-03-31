/**
 * 応答系テスト
 * Spec: 03.5_test_plan.md — US-08〜US-10
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

const REPORTER_PHONE = '+819039655913'
const MEDICAL_PHONE = '+819011112222'

const REPORTER_LAT = 35.6762
const REPORTER_LNG = 139.6503
const NEARBY_LAT = 35.6842
const NEARBY_LNG = 139.6503

async function getToken(
  phone: string,
  role: 'reporter' | 'medical'
): Promise<{ token: string; userId: number }> {
  await request(server).post('/auth/send-otp').send({ phoneNumber: phone })
  const { getStoredOtp } = await import('../services/auth.service')
  const otp = getStoredOtp(phone)
  const res = await request(server).post('/auth/verify-otp').send({
    phoneNumber: phone,
    otp,
    role,
  })
  return { token: res.body.token as string, userId: res.body.user.id as number }
}

async function createEmergency(reporterToken: string): Promise<number> {
  const res = await request(server)
    .post('/emergency')
    .set('Authorization', `Bearer ${reporterToken}`)
    .send({
      lat: REPORTER_LAT,
      lng: REPORTER_LNG,
      symptoms: ['意識がない'],
    })
  return Number(res.body.emergencyId)
}

describe('POST /emergency/:id/response', () => {
  /** Spec: 03.5_test_plan.md — US-08 */
  it('医療従事者が accept で応答するとSTATUSがRESPONDINGになる', async () => {
    // Arrange: 通報者で緊急通報を作成
    const { token: reporterToken } = await getToken(REPORTER_PHONE, 'reporter')
    const { token: medToken } = await getToken(MEDICAL_PHONE, 'medical')

    // 医療従事者の位置情報を更新（近隣）
    await request(server)
      .put('/location')
      .set('Authorization', `Bearer ${medToken}`)
      .send({ lat: NEARBY_LAT, lng: NEARBY_LNG })

    const emergencyId = await createEmergency(reporterToken)

    // When: POST /emergency/:id/response に { action: "accept" } を送信
    const res = await request(server)
      .post(`/emergency/${emergencyId}/response`)
      .set('Authorization', `Bearer ${medToken}`)
      .send({ action: 'accept' })

    // Then: ステータス200
    expect(res.status).toBe(200)

    // And: DBにEmergencyResponseレコードが作成される（action: ACCEPTED）
    const { userId: medUserId } = await getToken(MEDICAL_PHONE, 'medical')
    // NOTE: getToken は新しいユーザーを作るのではなく、既存ユーザーのトークンを返す
    // 実際のuserIdはDBから取得
    const medUser = await prisma.user.findUnique({
      where: { phoneNumber: MEDICAL_PHONE },
    })
    const response = await prisma.emergencyResponse.findFirst({
      where: {
        emergencyId,
        responderId: medUser!.id,
      },
    })
    expect(response).not.toBeNull()
    expect(response?.action).toBe('ACCEPTED')

    // And: 緊急通報のステータスが RESPONDING に更新される
    const emergency = await prisma.emergency.findUnique({
      where: { id: emergencyId },
    })
    expect(emergency?.status).toBe('RESPONDING')
  })

  /** Spec: 03.5_test_plan.md — US-09 */
  it('医療従事者が decline で応答するとステータスは変わらない', async () => {
    // Arrange
    const { token: reporterToken } = await getToken(REPORTER_PHONE, 'reporter')
    const { token: medToken } = await getToken(MEDICAL_PHONE, 'medical')
    const emergencyId = await createEmergency(reporterToken)

    // When: POST /emergency/:id/response に { action: "decline" } を送信
    const res = await request(server)
      .post(`/emergency/${emergencyId}/response`)
      .set('Authorization', `Bearer ${medToken}`)
      .send({ action: 'decline' })

    // Then: ステータス200
    expect(res.status).toBe(200)

    const medUser = await prisma.user.findUnique({
      where: { phoneNumber: MEDICAL_PHONE },
    })
    // And: DBにEmergencyResponseレコードが作成される（action: DECLINED）
    const response = await prisma.emergencyResponse.findFirst({
      where: {
        emergencyId,
        responderId: medUser!.id,
      },
    })
    expect(response).not.toBeNull()
    expect(response?.action).toBe('DECLINED')

    // And: 緊急通報のステータスは変更されない（PENDING のまま）
    const emergency = await prisma.emergency.findUnique({
      where: { id: emergencyId },
    })
    expect(emergency?.status).toBe('PENDING')
  })

  /** Spec: 03.5_test_plan.md — US-10 */
  it('GET /emergency/:id で応答者情報が含まれる', async () => {
    // Arrange
    const { token: reporterToken } = await getToken(REPORTER_PHONE, 'reporter')
    const { token: medToken } = await getToken(MEDICAL_PHONE, 'medical')
    const emergencyId = await createEmergency(reporterToken)

    // 医療従事者が accept で応答
    await request(server)
      .post(`/emergency/${emergencyId}/response`)
      .set('Authorization', `Bearer ${medToken}`)
      .send({ action: 'accept' })

    // When: GET /emergency/:id を送信
    const res = await request(server)
      .get(`/emergency/${emergencyId}`)
      .set('Authorization', `Bearer ${reporterToken}`)

    // Then: ステータス200
    expect(res.status).toBe(200)

    // And: レスポンスの responses 配列に応答者情報が含まれる
    expect(res.body).toHaveProperty('responses')
    expect(Array.isArray(res.body.responses)).toBe(true)
    expect(res.body.responses.length).toBeGreaterThan(0)

    // And: 応答者の responderId, action: "ACCEPTED" が含まれる
    const response = res.body.responses[0]
    expect(response).toHaveProperty('responderId')
    expect(response.action).toBe('ACCEPTED')
  })
})
