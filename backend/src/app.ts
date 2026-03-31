import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoute } from './routes/auth'
import { emergencyRoute } from './routes/emergency'
import { responseRoute } from './routes/response'
import { locationRoute } from './routes/location'
import { sseRoute } from './routes/sse'
import { usersRoute } from './routes/users'
import { aedRoute } from './routes/aed'

export const app = new Hono()

// グローバルミドルウェア
if (process.env.NODE_ENV !== 'test') {
  app.use('*', logger())
}

app.use(
  '*',
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)

// ルート登録
app.route('/auth', authRoute)
app.route('/emergency', emergencyRoute)
app.route('/emergency', responseRoute)
app.route('/location', locationRoute)
app.route('/sse', sseRoute)
app.route('/users', usersRoute)

app.route('/aed', aedRoute)

// ヘルスチェック
app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
