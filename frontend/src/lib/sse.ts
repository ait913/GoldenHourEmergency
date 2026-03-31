const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export type SSEEventData = {
  type: 'emergency' | 'response_update' | 'ping' | 'connected'
  [key: string]: unknown
}

type SSEHandler = (data: SSEEventData) => void

/**
 * SSE接続を確立して管理する
 * @param token JWTトークン（クエリパラメータで渡す）
 * @param onEvent イベントハンドラー
 * @returns disconnect関数
 */
export function connectSSE(
  token: string,
  onEvent: SSEHandler
): () => void {
  const url = `${API_URL}/sse/notifications?token=${encodeURIComponent(token)}`
  const eventSource = new EventSource(url)

  const handleMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as SSEEventData
      onEvent(data)
    } catch {
      console.error('[sse] Failed to parse event data:', event.data)
    }
  }

  // 各イベントタイプをリッスン
  eventSource.addEventListener('emergency', handleMessage)
  eventSource.addEventListener('response_update', handleMessage)
  eventSource.addEventListener('ping', handleMessage)
  eventSource.addEventListener('connected', handleMessage)

  eventSource.onerror = () => {
    console.error('[sse] Connection error, will auto-reconnect')
  }

  return () => {
    eventSource.close()
  }
}
