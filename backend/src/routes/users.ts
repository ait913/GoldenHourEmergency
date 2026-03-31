import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.middleware'
import { prisma } from '../prisma/client'
import type { JwtPayload } from '../types'

type AppContext = {
  Variables: {
    jwtPayload: JwtPayload
  }
}

export const usersRoute = new Hono<AppContext>()

/**
 * GET /users/me
 * 現在のユーザー情報を取得する（認証必須）
 */
usersRoute.get('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      phoneNumber: true,
      name: true,
      role: true,
    },
  })

  if (!user) {
    return c.json({ error: 'User not found' }, 404)
  }

  return c.json(user)
})

/**
 * PUT /users/me
 * ユーザー情報を更新する（認証必須）
 */
usersRoute.put('/me', authMiddleware, async (c) => {
  const payload = c.get('jwtPayload')
  const body = await c.req.json()
  const { name } = body

  const user = await prisma.user.update({
    where: { id: payload.userId },
    data: { name: name ?? undefined },
    select: {
      id: true,
      phoneNumber: true,
      name: true,
      role: true,
    },
  })

  return c.json(user)
})
