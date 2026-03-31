'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { getToken } from '@/lib/auth'
import { connectSSE } from '@/lib/sse'
import { aedApi, type AedItem } from '@/lib/aed'
import type { ResponderItem } from '@/components/map/ResponderMarker'

// LeafletはSSR不可のためdynamic importで遅延読み込み
const EmergencyMap = dynamic(
  () => import('@/components/map/EmergencyMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[55vh] bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
        <p className="text-gray-400 text-sm">マップを読み込み中...</p>
      </div>
    ),
  }
)

type StatusType = 'searching' | 'responding' | 'arrived'

export default function WaitingPage() {
  const router = useRouter()
  const [responders, setResponders] = useState<ResponderItem[]>([])
  const [status, setStatus] = useState<StatusType>('searching')
  const [aeds, setAeds] = useState<AedItem[]>([])
  const [userLat] = useState(35.6762) // TODO: 実際のGPS座標に置き換える
  const [userLng] = useState(139.6503)

  // AED取得
  useEffect(() => {
    aedApi
      .getNearby(userLat, userLng)
      .then((data) => setAeds(data.aeds))
      .catch((err) => console.warn('AED取得失敗（表示は継続）:', err))
  }, [userLat, userLng])

  // SSE接続
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    const disconnect = connectSSE(token, (data) => {
      if (data.type === 'response_update') {
        const responses = data.responses as ResponderItem[]
        setResponders(responses)
        if (responses.some((r) => r.action === 'ACCEPTED')) {
          setStatus('responding')
        }
      }
    })

    return () => disconnect()
  }, [router])

  const nearestAed = aeds.length > 0
    ? aeds.reduce((prev, curr) => prev.distance < curr.distance ? prev : curr)
    : null

  const statusConfig: Record<StatusType, { icon: string; text: string; color: string }> = {
    searching: { icon: '🔄', text: '救助者を探しています...', color: 'bg-blue-50 text-blue-700' },
    responding: { icon: '🟢', text: '救助者が向かっています！', color: 'bg-green-50 text-green-700' },
    arrived: { icon: '✅', text: '救助者が到着しました', color: 'bg-green-100 text-green-800' },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {/* 119番発信確認バー（sticky — 常に最上部に固定） */}
      <div className="sticky top-0 z-50 bg-[#dc2626] text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold text-base">119番に発信しました</p>
            <p className="text-xs opacity-90">※通話を継続してください</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Leafletマップ（メイン — 55vh） */}
        <div className="rounded-xl overflow-hidden shadow-md">
          <EmergencyMap
            userLat={userLat}
            userLng={userLng}
            aeds={aeds}
            responders={responders}
          />
        </div>

        {/* 状態バッジ */}
        <div className={`px-4 py-3 rounded-xl ${currentStatus.color}`}>
          <p className="font-semibold text-sm">
            {currentStatus.icon} {currentStatus.text}
          </p>
        </div>

        {/* AEDサマリー（最寄り1件） */}
        {nearestAed && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-500 font-medium">💙 最寄りAED</p>
              <p className="text-sm font-bold text-blue-800 mt-0.5">
                {nearestAed.name || 'AED'} — {nearestAed.distance}m
              </p>
            </div>
            <a
              href={`https://maps.google.com/maps?daddr=${nearestAed.lat},${nearestAed.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline font-medium ml-4 shrink-0"
            >
              道順→
            </a>
          </div>
        )}

        {/* 応答者リスト */}
        {responders.filter((r) => r.action === 'ACCEPTED').length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">応答した医療従事者</h3>
            <div className="space-y-2">
              {responders
                .filter((r) => r.action === 'ACCEPTED')
                .map((r) => (
                  <div
                    key={r.responderId}
                    className="bg-white border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm shrink-0">
                      {r.responderName?.[0] ?? '医'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {r.responderName || '医療従事者'}
                      </p>
                      <p className="text-xs text-green-600">向かっています</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
