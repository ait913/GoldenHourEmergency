/**
 * AED APIクライアント — 認証不要エンドポイント
 */

export interface AedItem {
  id: string
  lat: number
  lng: number
  name?: string
  address?: string
  distance: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const aedApi = {
  /**
   * 近隣AEDを取得する（認証不要）
   */
  getNearby: async (lat: number, lng: number): Promise<{ aeds: AedItem[] }> => {
    const res = await fetch(
      `${API_URL}/aed/nearby?lat=${lat}&lng=${lng}`
      // Authorization ヘッダーなし（緊急時の公開エンドポイント）
    )

    if (!res.ok) {
      throw new Error(`AED API error: ${res.status}`)
    }

    return res.json()
  },
}
