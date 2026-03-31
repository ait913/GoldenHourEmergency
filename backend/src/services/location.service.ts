import { prisma } from '../prisma/client'
import type { NearbyMedical } from '../types'

/**
 * 医療従事者の位置情報を更新する
 * PostGIS geography型を使用して保存する
 */
export async function updateLocation(
  userId: number,
  lat: number,
  lng: number
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE medical_profiles
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        "updatedAt" = NOW()
    WHERE "userId" = ${userId}
  `
}

/**
 * 指定座標から半径radiusMeters以内の利用可能な医療従事者を取得する
 * PostGIS ST_DWithinを使用
 */
export async function findNearbyMedicals(
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<NearbyMedical[]> {
  const results = await prisma.$queryRaw<
    Array<{ userId: number; distanceMeters: number }>
  >`
    SELECT
      "userId",
      ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      ) as "distanceMeters"
    FROM medical_profiles
    WHERE
      "isAvailable" = true
      AND location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY "distanceMeters" ASC
  `

  return results.map((r) => ({
    userId: Number(r.userId),
    distanceMeters: Number(r.distanceMeters),
  }))
}
