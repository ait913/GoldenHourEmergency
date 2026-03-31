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
      <header className="px-4 py-4 flex items-center justify-between border-b border-gray-100 bg-white">
        <div>
          <h1 className="font-bold text-[#b70011] text-lg">GoldenHourHelper</h1>
          <p className="text-xs text-gray-400">緊急医療支援アプリ</p>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="text-sm text-gray-500 w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
          aria-label="ユーザー設定"
        >
          👤
        </button>
      </header>

      {/* 使い方ガイド */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-800 font-medium">
            ⚠️ 緊急時は下のボタンを3秒長押し → 119番に自動発信
          </p>
        </div>
      </div>

      {/* 症状選択 */}
      <div className="px-4 pt-3">
        <h2 className="text-sm font-medium text-gray-700 mb-2">
          症状を選択（複数可・任意）
        </h2>
        <SymptomSelector onChange={setSymptoms} />
      </div>

      {/* HELPボタン */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <HelpButton onTrigger={handleTrigger} symptoms={symptoms} />
        <p className="text-xs text-gray-400 mt-4 text-center">
          3秒長押しで発動します
        </p>
      </div>
    </div>
  )
}
