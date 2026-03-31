/**
 * 認証系テスト
 * Spec: 03.5_test_plan.md — US-01〜US-04
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

const TEST_PHONE = '+819039655913'

describe('POST /auth/send-otp', () => {
  /** Spec: 03.5_test_plan.md — US-01 */
  it('未登録の電話番号でOTPを送信すると200が返る', async () => {
    // Arrange: システムに未登録の電話番号
    // When: POST /auth/send-otp に有効な電話番号を送信
    const res = await request(server).post('/auth/send-otp').send({
      phoneNumber: TEST_PHONE,
    })

    // Then: ステータス200
    expect(res.status).toBe(200)
    // And: レスポンスに message が含まれる
    expect(res.body).toHaveProperty('message')
  })

  /** Spec: 03.5_test_plan.md — US-01 (SMS呼び出し確認) */
  it('OTP送信時にSMSサービスが呼び出される', async () => {
    const { sendSms } = await import('../services/sms.service')

    await request(server).post('/auth/send-otp').send({
      phoneNumber: TEST_PHONE,
    })

    // Then: SMSサービスが当該番号に対して呼び出される
    expect(sendSms).toHaveBeenCalledWith(
      expect.stringContaining('819039655913'),
      expect.any(String)
    )
  })

  /** Spec: 03.5_test_plan.md — US-01 (バリデーション) */
  it('不正な形式の電話番号を送信すると400が返る', async () => {
    // Arrange: 不正な形式の電話番号
    // When: POST /auth/send-otp に { phoneNumber: "invalid" } を送信
    const res = await request(server).post('/auth/send-otp').send({
      phoneNumber: 'invalid',
    })

    // Then: ステータス400
    expect(res.status).toBe(400)
    // And: エラーメッセージが返される
    expect(res.body).toHaveProperty('error')
  })
})

describe('POST /auth/verify-otp', () => {
  /** Spec: 03.5_test_plan.md — US-02 */
  it('医療従事者ロールでのOTP検証が成功するとrole:MEDICALのJWTが返る', async () => {
    // Arrange: OTPを先に発行
    await request(server).post('/auth/send-otp').send({
      phoneNumber: TEST_PHONE,
    })

    // テスト環境ではOTPをメモリから直接取得する仕組みが必要
    // OTPサービスのモックから実際のOTPを取得
    const { getStoredOtp } = await import('../services/auth.service')
    const otp = getStoredOtp(TEST_PHONE)

    // When: POST /auth/verify-otp に医療従事者ロールでOTPを送信
    const res = await request(server).post('/auth/verify-otp').send({
      phoneNumber: TEST_PHONE,
      otp,
      role: 'medical',
    })

    // Then: ステータス200
    expect(res.status).toBe(200)
    // And: レスポンスに { token, user: { role: "MEDICAL" } } が含まれる
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    expect(res.body.user.role).toBe('MEDICAL')

    // And: DBにUserレコードが作成される（role: MEDICAL）
    const user = await prisma.user.findUnique({
      where: { phoneNumber: TEST_PHONE },
      include: { medicalProfile: true },
    })
    expect(user).not.toBeNull()
    expect(user?.role).toBe('MEDICAL')

    // And: DBにMedicalProfileレコードが作成される
    expect(user?.medicalProfile).not.toBeNull()
  })

  /** Spec: 03.5_test_plan.md — US-03 */
  it('OTP検証成功時にJWT形式のトークンが返る', async () => {
    // Arrange: OTPを発行
    await request(server).post('/auth/send-otp').send({
      phoneNumber: TEST_PHONE,
    })
    const { getStoredOtp } = await import('../services/auth.service')
    const otp = getStoredOtp(TEST_PHONE)

    // When: 正しいOTPでverify
    const res = await request(server).post('/auth/verify-otp').send({
      phoneNumber: TEST_PHONE,
      otp,
      role: 'reporter',
    })

    // Then: ステータス200
    expect(res.status).toBe(200)
    // And: レスポンスに { token, user } が含まれる
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')

    // And: token はJWT形式（"."で区切られた3つのパート）
    const token: string = res.body.token
    const parts = token.split('.')
    expect(parts).toHaveLength(3)

    // And: token のペイロードに userId と role が含まれる
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    expect(payload).toHaveProperty('userId')
    expect(payload).toHaveProperty('role')
  })

  /** Spec: 03.5_test_plan.md — US-04 */
  it('不正なOTPで検証すると401が返りJWTは返らない', async () => {
    // Arrange: OTPを発行しておく
    await request(server).post('/auth/send-otp').send({
      phoneNumber: TEST_PHONE,
    })

    // When: 不正なOTP "000000" を送信
    const res = await request(server).post('/auth/verify-otp').send({
      phoneNumber: TEST_PHONE,
      otp: '000000',
      role: 'reporter',
    })

    // Then: ステータス401
    expect(res.status).toBe(401)
    // And: エラーメッセージが返される
    expect(res.body).toHaveProperty('error')
    // And: JWTトークンは返されない
    expect(res.body).not.toHaveProperty('token')
  })
})
