import { sign, verify } from 'hono/jwt'
import { prisma } from '../prisma/client'
import { sendSms } from './sms.service'
import type { JwtPayload } from '../types'

// OTPストレージ: Map<phoneNumber, { otp: string, expiresAt: number }>
const otpStore = new Map<string, { otp: string; expiresAt: number }>()

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const OTP_TTL_MS = 5 * 60 * 1000 // 5分

/**
 * 電話番号を E.164 形式に正規化する
 * 090... → +8190...
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[-\s()]/g, '')
  if (digits.startsWith('+')) {
    return digits
  }
  if (digits.startsWith('0')) {
    return '+81' + digits.slice(1)
  }
  return '+' + digits
}

/**
 * 電話番号バリデーション
 * E.164形式または日本国内形式のみ許可
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  // E.164形式: +[1-15桁]
  const e164Regex = /^\+[1-9]\d{1,14}$/
  // 日本国内形式: 0から始まる10-11桁
  const jpRegex = /^0\d{9,10}$/
  const digits = phoneNumber.replace(/[-\s()]/g, '')
  return e164Regex.test(digits) || jpRegex.test(digits)
}

/**
 * 6桁のOTPを生成する
 */
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * OTPを送信する（SMSを送信し、メモリに保存）
 */
export async function sendOtp(phoneNumber: string): Promise<void> {
  const normalized = normalizePhoneNumber(phoneNumber)
  const otp = generateOtp()
  const expiresAt = Date.now() + OTP_TTL_MS

  // OTPをメモリに保存
  otpStore.set(normalized, { otp, expiresAt })

  // SMSを送信
  await sendSms(
    normalized,
    `GoldenHourHelper 認証コード: ${otp}\n有効期限: 5分`
  )
}

/**
 * テスト用: 保存されたOTPを取得する
 * 本番環境では使用しない
 */
export function getStoredOtp(phoneNumber: string): string {
  const normalized = normalizePhoneNumber(phoneNumber)
  const entry = otpStore.get(normalized)
  if (!entry) {
    throw new Error(`OTP not found for ${normalized}`)
  }
  return entry.otp
}

/**
 * OTPを検証し、JWTを発行する
 */
export async function verifyOtpAndIssueJwt(
  phoneNumber: string,
  otp: string,
  role: 'reporter' | 'medical'
): Promise<{ token: string; user: { id: number; phoneNumber: string; name: string | null; role: string } }> {
  const normalized = normalizePhoneNumber(phoneNumber)
  const entry = otpStore.get(normalized)

  // OTPの存在・有効期限・値を確認
  if (!entry || Date.now() > entry.expiresAt || entry.otp !== otp) {
    throw new Error('Invalid or expired OTP')
  }

  // OTPを削除（使い捨て）
  otpStore.delete(normalized)

  // ユーザーをupsert（存在しなければ作成）
  const dbRole = role === 'medical' ? 'MEDICAL' : 'REPORTER'
  const user = await prisma.user.upsert({
    where: { phoneNumber: normalized },
    create: {
      phoneNumber: normalized,
      role: dbRole,
    },
    update: {},
  })

  // 医療従事者の場合MedicalProfileを作成（存在しなければ）
  if (user.role === 'MEDICAL') {
    await prisma.medicalProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        isAvailable: true,
        updatedAt: new Date(),
      },
      update: {},
    })
  }

  // JWTを発行（有効期限: 7日）
  const payload = {
    userId: user.id,
    role: user.role as 'REPORTER' | 'MEDICAL',
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7日
  }

  const token = await sign(payload as Record<string, unknown>, JWT_SECRET)

  return {
    token,
    user: {
      id: user.id,
      phoneNumber: user.phoneNumber,
      name: user.name,
      role: user.role,
    },
  }
}

/**
 * JWTを検証してペイロードを返す
 */
export async function verifyJwt(token: string): Promise<JwtPayload> {
  const payload = await verify(token, JWT_SECRET, 'HS256') as unknown
  return payload as JwtPayload
}
