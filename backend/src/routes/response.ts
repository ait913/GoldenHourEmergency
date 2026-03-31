import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { respondToEmergency } from '../services/emergency.service'
import type { JwtPayload } from '../types'

type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const responseRoute = new Hono<AppContext>()

/**
 * POST /emergency/:id/response
 * 緊急通報に応答する（認証必須）
 */
responseRoute.post('/:id/response', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const emergencyId = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const { action } = body

  if (isNaN(emergencyId)) {
    return c.json({ error: 'Invalid emergency id' }, 400)
  }

  if (action !== 'accept' && action !== 'decline') {
    return c.json({ error: 'action must be "accept" or "decline"' }, 400)
  }

  try {
    await respondToEmergency(emergencyId, payload.userId, action)
    return c.json({ message: 'Response recorded' })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return c.json({ error: 'Already responded to this emergency' }, 409)
    }
    console.error('[response] respondToEmergency error:', error)
    return c.json({ error: 'Failed to record response' }, 500)
  }
})
