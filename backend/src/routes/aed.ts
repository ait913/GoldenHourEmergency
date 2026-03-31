import { Hono } from 'hono'
import { fetchNearbyAeds } from '../services/aed.service'

export const aedRoute = new Hono()

/**
 * GET /aed/nearby?lat={number}&lng={number}&radius={number}
 * 近隣AEDを取得する（認証不要）
 */
aedRoute.get('/nearby', async (c) => {
  const latStr = c.req.query('lat')
  const lngStr = c.req.query('lng')
  const radiusStr = c.req.query('radius')

  // バリデーション: lat/lng 必須
  if (!latStr || !lngStr) {
    return c.json({ error: 'lat and lng are required' }, 400)
  }

  const lat = parseFloat(latStr)
  const lng = parseFloat(lngStr)

  if (isNaN(lat) || isNaN(lng)) {
    return c.json({ error: 'lat and lng must be valid numbers' }, 400)
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return c.json({ error: 'lat or lng out of range' }, 400)
  }

  const radius = radiusStr ? parseInt(radiusStr, 10) : 2000

  try {
    const aeds = await fetchNearbyAeds(lat, lng, radius)
    return c.json({ aeds })
  } catch (error) {
    console.error('AED fetch error:', error)
    return c.json({ error: 'Failed to fetch AED data' }, 502)
  }
})
