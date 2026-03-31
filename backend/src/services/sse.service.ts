import type { SSEStreamingApi } from 'hono/streaming'

// SSEクライアントの管理 Map<userId, SSEStreamingApi>
const clients = new Map<number, SSEStreamingApi>()

/**
 * SSEクライアントを登録する
 */
export function addClient(userId: number, stream: SSEStreamingApi): void {
  clients.set(userId, stream)
}

/**
 * SSEクライアントを削除する
 */
export function removeClient(userId: number): void {
  clients.delete(userId)
}

/**
 * 接続中のクライアントMapを取得
 */
export function getConnectedClients(): Map<number, SSEStreamingApi> {
  return clients
}

/**
 * 特定ユーザーにSSEイベントを送信する
 */
export async function notifyUser(
  userId: number,
  data: Record<string, unknown>
): Promise<void> {
  const stream = clients.get(userId)
  if (!stream) {
    return
  }

  try {
    await stream.writeSSE({
      event: data.type as string,
      data: JSON.stringify(data),
    })
  } catch (error) {
    console.error(`[sse.service] Failed to notify user ${userId}:`, error)
    clients.delete(userId)
  }
}
