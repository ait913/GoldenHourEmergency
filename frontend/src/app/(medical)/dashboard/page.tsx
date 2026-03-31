'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/auth'
import { connectSSE } from '@/lib/sse'
import { emergencyApi, locationApi } from '@/lib/api'
import EmergencyAlert from '@/components/emergency/EmergencyAlert'
import StatusBadge from '@/components/ui/StatusBadge'

interface EmergencyNotification {
  emergencyId: number
  symptoms: string[]
  lat: number
  lng: number
  distanceMeters: number
}

export default function MedicalDashboardPage() {
  const router = useRouter()
  const [isAvailable, setIsAvailable] = useState(true)
  const [emergencies, setEmergencies] = useState<EmergencyNotification[]>([])
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    // SSE接続
    const disconnect = connectSSE(token, (data) => {
      if (data.type === 'emergency') {
        const notification = data as unknown as EmergencyNotification & {
          type: string
        }
        setEmergencies((prev) => [
          ...prev.filter((e) => e.emergencyId !== notification.emergencyId),
          {
            emergencyId: notification.emergencyId,
            symptoms: notification.symptoms,
            lat: notification.lat,
            lng: notification.lng,
            distanceMeters: notification.distanceMeters,
          },
        ])
      }
    })

    // 位置情報を30秒おきに更新
    const locationInterval = setInterval(() => {
      if (!isAvailable) return
      navigator.geolocation.getCurrentPosition((pos) => {
        locationApi.update(pos.coords.latitude, pos.coords.longitude)
      })
    }, 30000)

    // 初回位置情報を送信
    navigator.geolocation.getCurrentPosition((pos) => {
      locationApi.update(pos.coords.latitude, pos.coords.longitude)
    })

    return () => {
      disconnect()
      clearInterval(locationInterval)
    }
  }, [router, isAvailable])

  const handleAccept = async (emergencyId: number) => {
    setIsResponding(true)
    try {
      await emergencyApi.respond(emergencyId, 'accept')
      setEmergencies((prev) => prev.filter((e) => e.emergencyId !== emergencyId))
    } catch (e) {
      console.error('Failed to accept emergency:', e)
    } finally {
      setIsResponding(false)
    }
  }

  const handleDecline = async (emergencyId: number) => {
    setIsResponding(true)
    try {
      await emergencyApi.respond(emergencyId, 'decline')
      setEmergencies((prev) => prev.filter((e) => e.emergencyId !== emergencyId))
    } catch (e) {
      console.error('Failed to decline emergency:', e)
    } finally {
      setIsResponding(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
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

      <div className="px-4 py-4">
        {/* ステータストグル */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-white rounded-xl">
          <span className="text-sm font-medium text-gray-700">ステータス:</span>
          <StatusBadge isOnline={isAvailable} />
          <button
            onClick={() => setIsAvailable(!isAvailable)}
            className={`ml-auto w-12 h-6 rounded-full transition-colors ${
              isAvailable ? 'bg-green-500' : 'bg-gray-300'
            }`}
            aria-label={isAvailable ? '対応可能（クリックで変更）' : '対応不可（クリックで変更）'}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isAvailable ? 'translate-x-6' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* 緊急通報アラート */}
        {emergencies.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-700 flex items-center gap-1">
              <span>⚠️</span> 新着アラート
            </h2>
            {emergencies.map((e) => (
              <EmergencyAlert
                key={e.emergencyId}
                {...e}
                onAccept={() => handleAccept(e.emergencyId)}
                onDecline={() => handleDecline(e.emergencyId)}
                isLoading={isResponding}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-2xl mb-2">📡</p>
            <p>通報を待機中...</p>
          </div>
        )}
      </div>
    </div>
  )
}
