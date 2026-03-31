import { serve } from '@hono/node-server'
import { app } from './app'

const port = parseInt(process.env.PORT || '8080')

serve({
  fetch: app.fetch,
  port,
})

console.log(`[server] GoldenHourHelper backend is running on port ${port}`)
