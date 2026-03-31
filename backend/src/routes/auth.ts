import { Hono } from 'hono'
import {
  sendOtp,
  verifyOtpAndIssueJwt,
  validatePhoneNumber,
} from '../services/auth.service'

export const authRoute = new Hono()

/**
 * POST /auth/send-otp
 * SMSでOTPを送信する
 */
authRoute.post('/send-otp', async (c) => {
  const body = await c.req.json()
  const { phoneNumber } = body

  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return c.json({ error: 'phoneNumber is required' }, 400)
  }

  if (!validatePhoneNumber(phoneNumber)) {
    return c.json({ error: 'Invalid phone number format' }, 400)
  }

  try {
    await sendOtp(phoneNumber)
    return c.json({ message: 'OTP sent successfully' })
  } catch (error) {
    console.error('[auth] sendOtp error:', error)
    return c.json({ error: 'Failed to send OTP' }, 500)
  }
})

/**
 * POST /auth/verify-otp
 * OTPを検証してJWTを発行する
 */
authRoute.post('/verify-otp', async (c) => {
  const body = await c.req.json()
  const { phoneNumber, otp, role } = body

  if (!phoneNumber || !otp || !role) {
    return c.json({ error: 'phoneNumber, otp, and role are required' }, 400)
  }

  if (role !== 'reporter' && role !== 'medical') {
    return c.json({ error: 'role must be "reporter" or "medical"' }, 400)
  }

  try {
    const result = await verifyOtpAndIssueJwt(phoneNumber, otp, role)
    return c.json(result)
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Invalid or expired OTP'
    ) {
      return c.json({ error: 'Invalid or expired OTP' }, 401)
    }
    console.error('[auth] verifyOtp error:', error)
    return c.json({ error: 'Internal server error' }, 500)
  }
})
