/**
 * AED Service — Overpass API proxy + メモリキャッシュ
 */

export interface AedItem {
  id: string
  lat: number
  lng: number
  name?: string
  address?: string
  distance: number
}

interface CacheEntry {
  data: AedItem[]
  expiredAt: number
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  // way/relation の場合は中心座標
  center?: { lat: number; lon: number }
  tags?: {
    emergency?: string
    name?: string
    'addr:street'?: string
    'addr:city'?: string
    [key: string]: string | undefined
  }
}

interface OverpassResponse {
  elements: OverpassElement[]
}

const cache = new Map<string, CacheEntry>()
const TTL_MS = 5 * 60 * 1000 // 5分

/** テスト用: キャッシュを全クリア */
export function clearAedCache(): void {
  cache.clear()
}

function getCacheKey(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 100) / 100
  const roundedLng = Math.round(lng * 100) / 100
  return `${roundedLat},${roundedLng}`
}

function getCached(key: string): AedItem[] | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiredAt) {
    cache.delete(key)
    return null
  }
  return entry.data
}

function setCached(key: string, data: AedItem[]): void {
  cache.set(key, {
    data,
    expiredAt: Date.now() + TTL_MS,
  })
}

/**
 * Haversine式で2点間の距離（メートル）を計算
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000 // 地球半径（メートル）
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

export async function fetchNearbyAeds(
  lat: number,
  lng: number,
  radius = 2000
): Promise<AedItem[]> {
  const key = getCacheKey(lat, lng)
  const cached = getCached(key)
  if (cached !== null) {
    return cached
  }

  const query = `[out:json][timeout:10];nwr["emergency"="defibrillator"](around:${radius},${lat},${lng});out body geom;`

  const response = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status}`)
  }

  const data = (await response.json()) as OverpassResponse

  const aeds: AedItem[] = data.elements
    .filter((el) => {
      // 座標が存在する要素のみ
      const elLat = el.lat ?? el.center?.lat
      const elLon = el.lon ?? el.center?.lon
      return elLat !== undefined && elLon !== undefined
    })
    .map((el) => {
      const elLat = (el.lat ?? el.center?.lat) as number
      const elLon = (el.lon ?? el.center?.lon) as number
      const name = el.tags?.name
      const street = el.tags?.['addr:street']
      const city = el.tags?.['addr:city']
      const addressParts = [city, street].filter(Boolean)
      const address = addressParts.length > 0 ? addressParts.join(' ') : undefined

      return {
        id: `${el.type}/${el.id}`,
        lat: elLat,
        lng: elLon,
        name,
        address,
        distance: haversineDistance(lat, lng, elLat, elLon),
      }
    })

  setCached(key, aeds)
  return aeds
}
