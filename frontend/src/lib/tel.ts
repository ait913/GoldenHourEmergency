/**
 * tel:119 発火ロジック
 *
 * 最重要設計原則:
 * - window.location.href = 'tel:119' を先に実行
 * - navigator.sendBeacon() でAPIをノンブロッキング送信
 * - API失敗で119が止まらない
 */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export interface EmergencyPayload {
  lat: number
  lng: number
  symptoms: string[]
}

/**
 * 119番を発火し、同時に緊急通報APIをノンブロッキングで送信する
 *
 * @param payload 送信する緊急通報データ
 * @param token JWTトークン（送信時に使用）
 */
export function triggerEmergency(
  payload: EmergencyPayload,
  token: string
): void {
  // Step 1: 119番コール（最優先 — これが一番最初に実行される）
  window.location.href = 'tel:119'

  // Step 2: バックエンドへノンブロッキング送信
  // sendBeaconの失敗はtel:119の発火に一切影響しない
  try {
    const data = JSON.stringify(payload)
    const blob = new Blob([data], { type: 'application/json' })
    navigator.sendBeacon(
      `${API_URL}/emergency?token=${encodeURIComponent(token)}`,
      blob
    )
  } catch {
    // sendBeaconが失敗してもtel:119は既に発火済み
    // エラーは無視する
  }
}
