import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { updateLocation } from '../services/location.service'
import type { JwtPayload } from '../types'

type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const locationRoute = new Hono<AppContext>()

/**
 * PUT /location
 * 医療従事者の位置情報を更新する（認証必須）
 */
locationRoute.put('/', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const body = await c.req.json()
  const { lat, lng } = body

  if (lat === undefined || lng === undefined) {
    return c.json({ error: 'lat and lng are required' }, 400)
  }

  try {
    await updateLocation(payload.userId, Number(lat), Number(lng))
    return c.json({ message: 'Location updated' })
  } catch (error) {
    console.error('[location] updateLocation error:', error)
    return c.json({ error: 'Failed to update location' }, 500)
  }
})
