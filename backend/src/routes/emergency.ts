import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import {
  createEmergency,
  getEmergencyById,
} from '../services/emergency.service'
import type { JwtPayload } from '../types'

type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const emergencyRoute = new Hono<AppContext>()

/**
 * POST /emergency
 * 緊急通報を作成する（認証必須）
 */
emergencyRoute.post('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const body = await c.req.json()
  const { lat, lng, symptoms } = body

  if (lat === undefined || lng === undefined) {
    return c.json({ error: 'lat and lng are required' }, 400)
  }

  if (!Array.isArray(symptoms)) {
    return c.json({ error: 'symptoms must be an array' }, 400)
  }

  try {
    const result = await createEmergency(
      payload.userId,
      Number(lat),
      Number(lng),
      symptoms
    )
    return c.json(result, 201)
  } catch (error) {
    console.error('[emergency] createEmergency error:', error)
    return c.json({ error: 'Failed to create emergency' }, 500)
  }
})

/**
 * GET /emergency/:id
 * 緊急通報を取得する（認証必須）
 */
emergencyRoute.get('/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))

  if (isNaN(id)) {
    return c.json({ error: 'Invalid emergency id' }, 400)
  }

  const emergency = await getEmergencyById(id)

  if (!emergency) {
    return c.json({ error: 'Emergency not found' }, 404)
  }

  return c.json(emergency)
})
