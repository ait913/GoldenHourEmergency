import type { Context, MiddlewareHandler, Next } from 'hono'
import { verifyJwt } from '../services/auth.service'
import type { JwtPayload } from '../types'

// Honoのコンテキスト型拡張
type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

/**
 * JWT認証ミドルウェア
 * AuthorizationヘッダーまたはクエリパラメータtokenからJWTを検証する
 */
export const authMiddleware: MiddlewareHandler = async (
  c: Context,
  next: Next
) => {
  let token: string | null = null

  // 1. Authorizationヘッダーから取得
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  }

  // 2. クエリパラメータtokenから取得（SSE用）
  if (!token) {
    token = c.req.query('token') || null
  }

  if (!token) {
    return c.json({ error: 'Unauthorized: No token provided' }, 401)
  }

  try {
    const payload = await verifyJwt(token)
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ error: 'Unauthorized: Invalid or expired token' }, 401)
  }
}
