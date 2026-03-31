'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'
import { connectSSE } from '@/lib/sse'
import ResponderCard from '@/components/ui/ResponderCard'

interface Responder {
  responderId: number
  responderName: string | null
  action: 'ACCEPTED' | 'DECLINED'
}

export default function WaitingPage() {
  const router = useRouter()
  const [responders, setResponders] = useState<Responder[]>([])
  const [status, setStatus] = useState<'searching' | 'responding'>('searching')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    const disconnect = connectSSE(token, (data) => {
      if (data.type === 'response_update') {
        const responses = data.responses as Responder[]
        setResponders(responses)
        if (responses.some((r) => r.action === 'ACCEPTED')) {
          setStatus('responding')
        }
      }
    })

    return () => disconnect()
  }, [router])

  return (
    <div className="min-h-screen bg-[#f8f9ff] px-4 py-8">
      {/* 119番発信確認 */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-[#121c2a]">
          119番に
          <br />
          発信しました
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          ＊119番との通話を継続してください
        </p>
      </div>

      {/* 医療従事者検索状況 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="animate-spin">⟳</div>
          <p className="text-sm text-gray-600">周辺の医療従事者に通知中...</p>
        </div>

        {status === 'responding' && (
          <div className="p-4 bg-[#eff4ff] rounded-xl text-center">
            <p className="text-lg font-bold text-[#005e8d]">
              🟢 助けが来ます！
            </p>
          </div>
        )}
      </div>

      {/* 応答者リスト */}
      {responders.filter((r) => r.action === 'ACCEPTED').length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            応答した医療従事者
          </h3>
          <div className="space-y-2">
            {responders
              .filter((r) => r.action === 'ACCEPTED')
              .map((r) => (
                <ResponderCard key={r.responderId} {...r} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
