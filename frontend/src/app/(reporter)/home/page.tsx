'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import HelpButton from '@/components/ui/HelpButton'
import SymptomSelector from '@/components/ui/SymptomSelector'
import { getToken, isTokenValid } from '@/lib/auth'
import { triggerEmergency } from '@/lib/tel'

export default function ReporterHomePage() {
  const router = useRouter()
  const [symptoms, setSymptoms] = useState<string[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token || !isTokenValid(token)) {
      router.replace('/login')
    }
  }, [router])

  const handleTrigger = () => {
    const token = getToken()
    if (!token) return

    // 位置情報を取得（失敗してもAPIに送信）
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          triggerEmergency(
            {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              symptoms,
            },
            token
          )
          router.push('/waiting')
        },
        () => {
          // 位置情報取得失敗時はデフォルト座標（0,0）で送信
          triggerEmergency({ lat: 0, lng: 0, symptoms }, token)
          router.push('/waiting')
        }
      )
    } else {
      triggerEmergency({ lat: 0, lng: 0, symptoms }, token)
      router.push('/waiting')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col">
      {/* ヘッダー */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
        <h1 className="font-bold text-[#121c2a]">GoldenHourHelper</h1>
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-gray-500"
        >
          👤
        </button>
      </header>

      {/* 症状選択 */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          症状を選択（複数可）
        </h2>
        <SymptomSelector onChange={setSymptoms} />
      </div>

      {/* HELPボタン */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <HelpButton onTrigger={handleTrigger} symptoms={symptoms} />
      </div>
    </div>
  )
}
