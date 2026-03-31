/**
 * 緊急通報系テスト（最重要）
 * Spec: 03.5_test_plan.md — US-05〜US-07
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { getTestServer } from '../test/server'
import { prisma } from '../prisma/client'

const server = getTestServer()

// SMS送信サービスのモック
vi.mock('../services/sms.service', () => ({
  sendSms: vi.fn().mockResolvedValue({ success: true }),
}))

// SSEサービスのモック（通知確認用）
vi.mock('../services/sse.service', () => ({
  notifyUser: vi.fn(),
  addClient: vi.fn(),
  removeClient: vi.fn(),
  getConnectedClients: vi.fn().mockReturnValue(new Map()),
}))

const TEST_PHONE = '+819039655913'
const MEDICAL_PHONE = '+819012345678'
const MEDICAL_PHONE_FAR = '+819098765432'

// テスト座標（東京都心）
const REPORTER_LAT = 35.6762
const REPORTER_LNG = 139.6503
// 近隣座標（約894m）
const NEARBY_LAT = 35.6842
const NEARBY_LNG = 139.6503
// 範囲外座標（3km超）
const FAR_LAT = 35.7062
const FAR_LNG = 139.6503

/**
 * 通報者用JWTを取得するヘルパー
 */
async function getReporterToken(): Promise<string> {
  await request(server).post('/auth/send-otp').send({ phoneNumber: TEST_PHONE })
  const { getStoredOtp } = await import('../services/auth.service')
  const otp = getStoredOtp(TEST_PHONE)
  const res = await request(server).post('/auth/verify-otp').send({
    phoneNumber: TEST_PHONE,
    otp,
    role: 'reporter',
  })
  return res.body.token as string
}

/**
 * 医療従事者用JWTを取得してDBに位置情報を設定するヘルパー
 */
async function getMedicalToken(
  phone: string,
  lat: number,
  lng: number
): Promise<{ token: string; userId: number }> {
  await request(server).post('/auth/send-otp').send({ phoneNumber: phone })
  const { getStoredOtp } = await import('../services/auth.service')
  const otp = getStoredOtp(phone)
  const res = await request(server).post('/auth/verify-otp').send({
    phoneNumber: phone,
    otp,
    role: 'medical',
  })
  const token = res.body.token as string
  const userId = res.body.user.id as number

  // 位置情報を設定
  await request(server)
    .put('/location')
    .set('Authorization', `Bearer ${token}`)
    .send({ lat, lng })

  return { token, userId }
}

describe('POST /emergency', () => {
  /** Spec: 03.5_test_plan.md — US-05 (通常通報) */
  it('認証済み通報者が症状と位置情報で緊急通報を作成できる', async () => {
    // Arrange: 通報者として認証済みJWTを取得
    const token = await getReporterToken()

    // When: POST /emergency に症状と位置情報を送信
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lat: REPORTER_LAT,
        lng: REPORTER_LNG,
        symptoms: ['意識がない', 'けいれんしている'],
      })

    // Then: ステータスが200または201
    expect([200, 201]).toContain(res.status)
    // And: レスポンスに { emergencyId } が含まれる
    expect(res.body).toHaveProperty('emergencyId')

    // And: DBにEmergencyレコードが作成される（status: PENDING）
    const emergencyId = res.body.emergencyId
    const emergency = await prisma.emergency.findUnique({
      where: { id: Number(emergencyId) },
    })
    expect(emergency).not.toBeNull()
    expect(emergency?.status).toBe('PENDING')
    // And: symptoms, lat, lng が保存されている
    expect(emergency?.symptoms).toContain('意識がない')
    expect(emergency?.symptoms).toContain('けいれんしている')
    expect(emergency?.lat).toBe(REPORTER_LAT)
    expect(emergency?.lng).toBe(REPORTER_LNG)
  })

  /** Spec: 03.5_test_plan.md — US-05 (症状なし) */
  it('症状なし（空配列）でも緊急通報が作成される', async () => {
    // Arrange: 通報者として認証済みJWTを取得
    const token = await getReporterToken()

    // When: POST /emergency に症状なし（空配列）で送信
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${token}`)
      .send({
        lat: REPORTER_LAT,
        lng: REPORTER_LNG,
        symptoms: [],
      })

    // Then: ステータスが200または201
    expect([200, 201]).toContain(res.status)
    // And: 緊急通報が作成される（症状なしでも通報は受け付ける）
    expect(res.body).toHaveProperty('emergencyId')
  })

  /** Spec: 03.5_test_plan.md — US-06 (近隣検索) */
  it('半径2km以内の医療従事者は通知対象に含まれ、範囲外は含まれない', async () => {
    const { notifyUser } = await import('../services/sse.service')

    // Arrange: 近隣医療従事者（約894m）をセットアップ
    const { userId: nearbyUserId } = await getMedicalToken(
      MEDICAL_PHONE,
      NEARBY_LAT,
      NEARBY_LNG
    )

    // Arrange: 範囲外医療従事者（3km超）をセットアップ
    const { userId: farUserId } = await getMedicalToken(
      MEDICAL_PHONE_FAR,
      FAR_LAT,
      FAR_LNG
    )

    // Arrange: isAvailable を確認（デフォルトtrue）
    const nearbyProfile = await prisma.medicalProfile.findUnique({
      where: { userId: nearbyUserId },
    })
    expect(nearbyProfile?.isAvailable).toBe(true)

    // 通報者トークンを取得
    const reporterToken = await getReporterToken()

    // When: 緊急通報を作成
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        lat: REPORTER_LAT,
        lng: REPORTER_LNG,
        symptoms: ['意識がない'],
      })

    expect([200, 201]).toContain(res.status)

    // Then: 近隣医療従事者Aへ通知が送られる
    const notifyCalls = (notifyUser as ReturnType<typeof vi.fn>).mock.calls
    const notifiedUserIds = notifyCalls.map((call) => call[0])
    expect(notifiedUserIds).toContain(nearbyUserId)
    // And: 範囲外医療従事者Bへは通知されない
    expect(notifiedUserIds).not.toContain(farUserId)
  })

  /** Spec: 03.5_test_plan.md — US-06 (isAvailable: false) */
  it('isAvailable: false の医療従事者がいない場合、通報は正常に作成される', async () => {
    // Arrange: isAvailable: false の医療従事者をセットアップ
    const { userId, token: medToken } = await getMedicalToken(
      MEDICAL_PHONE,
      NEARBY_LAT,
      NEARBY_LNG
    )

    // isAvailable を false に設定
    await prisma.medicalProfile.update({
      where: { userId },
      data: { isAvailable: false },
    })

    // 通報者トークン
    const reporterToken = await getReporterToken()

    // When: 緊急通報を作成
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        lat: REPORTER_LAT,
        lng: REPORTER_LNG,
        symptoms: [],
      })

    // Then: 緊急通報は正常に作成される（医療従事者がいなくてもエラーにならない）
    expect([200, 201]).toContain(res.status)
    expect(res.body).toHaveProperty('emergencyId')
  })
})

describe('GET /sse/notifications — SSE通知（US-07）', () => {
  /** Spec: 03.5_test_plan.md — US-07 */
  it('緊急通報作成時に近隣医療従事者のSSEストリームにemergencyイベントが送信される', async () => {
    const { notifyUser } = await import('../services/sse.service')

    // Arrange: 近隣医療従事者をセットアップ
    const { userId: medUserId, token: medToken } = await getMedicalToken(
      MEDICAL_PHONE,
      NEARBY_LAT,
      NEARBY_LNG
    )

    // 通報者トークン
    const reporterToken = await getReporterToken()

    // When: 通報者が緊急通報を作成
    const res = await request(server)
      .post('/emergency')
      .set('Authorization', `Bearer ${reporterToken}`)
      .send({
        lat: REPORTER_LAT,
        lng: REPORTER_LNG,
        symptoms: ['意識がない'],
      })

    expect([200, 201]).toContain(res.status)

    // Then: notifyUser が近隣医療従事者のIDで呼び出される
    const notifyCalls = (notifyUser as ReturnType<typeof vi.fn>).mock.calls
    const callForMed = notifyCalls.find((call) => call[0] === medUserId)
    expect(callForMed).toBeDefined()

    // And: イベントデータに emergencyId, symptoms が含まれる
    const eventData = callForMed?.[1]
    expect(eventData).toHaveProperty('emergencyId')
    expect(eventData).toHaveProperty('symptoms')
  })
})
