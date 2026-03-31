'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, decodeToken, isTokenValid } from '@/lib/auth'

export default function RootPage() {
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      router.replace('/login')
      return
    }

    const payload = decodeToken(token)
    if (!payload) {
      router.replace('/login')
      return
    }

    if (payload.role === 'MEDICAL') {
      router.replace('/dashboard')
    } else {
      router.replace('/home')
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-400">読み込み中...</div>
    </div>
  )
}
