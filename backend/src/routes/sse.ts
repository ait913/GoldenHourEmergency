import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { authMiddleware } from '../middleware/auth.middleware'
import { addClient, removeClient } from '../services/sse.service'
import type { JwtPayload } from '../types'

type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const sseRoute = new Hono<AppContext>()

/**
 * GET /sse/notifications
 * SSEストリームに接続する（認証必須）
 * EventSourceはカスタムヘッダーを送れないため、クエリパラメータtokenをサポート
 */
sseRoute.get('/notifications', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const userId = payload.userId

  return streamSSE(c, async (stream) => {
    // クライアントを登録
    addClient(userId, stream)

    // 接続確立の通知
    await stream.writeSSE({
      event: 'connected',
      data: JSON.stringify({ userId }),
    })

    // 定期的なpingでSSE接続を維持（30秒おき）
    const pingInterval = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: 'ping',
          data: JSON.stringify({ type: 'ping' }),
        })
      } catch {
        clearInterval(pingInterval)
      }
    }, 30000)

    // 接続切断時のクリーンアップ
    stream.onAbort(() => {
      clearInterval(pingInterval)
      removeClient(userId)
    })

    // ストリームを維持するために長い待機
    await new Promise<void>((resolve) => {
      stream.onAbort(() => resolve())
    })
  })
})
