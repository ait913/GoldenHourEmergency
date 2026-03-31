import type { Context } from 'hono'

/**
 * グローバルエラーハンドラー
 */
export function errorHandler(err: Error, c: Context) {
  console.error('[error.middleware]', err)

  if (err.message === 'Invalid or expired OTP') {
    return c.json({ error: 'Invalid or expired OTP' }, 401)
  }

  return c.json(
    {
      error: 'Internal server error',
      message:
        process.env.NODE_ENV !== 'production' ? err.message : undefined,
    },
    500
  )
}
