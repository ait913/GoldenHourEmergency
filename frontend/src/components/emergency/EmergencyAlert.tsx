'use client'

interface EmergencyAlertProps {
  emergencyId: number
  symptoms: string[]
  distanceMeters: number
  lat: number
  lng: number
  onAccept: () => void
  onDecline: () => void
  isLoading?: boolean
}

export default function EmergencyAlert({
  emergencyId,
  symptoms,
  distanceMeters,
  lat,
  lng,
  onAccept,
  onDecline,
  isLoading = false,
}: EmergencyAlertProps) {
  const distanceText =
    distanceMeters < 1000
      ? `${Math.round(distanceMeters)}m`
      : `${(distanceMeters / 1000).toFixed(1)}km`

  // 経路案内リンク（現在地から通報者位置への経路）
  const directionsUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`
  // マップ表示リンク（通報者位置を中心）
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`

  return (
    <div className="bg-[#ffdad6] rounded-xl p-4 border border-red-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🔴</span>
        <h3 className="text-lg font-bold text-[#121c2a]">緊急通報</h3>
        <span className="ml-auto text-sm text-gray-600">{distanceText}先</span>
      </div>

      {symptoms.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-1">症状:</p>
          <ul className="text-sm text-[#121c2a] space-y-0.5">
            {symptoms.map((s) => (
              <li key={s}>　{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* マップリンク改善: 経路案内 + マップ表示 */}
      <div className="flex gap-3 mb-3">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-semibold text-white bg-blue-600 py-2 rounded-lg"
        >
          🗺️ 経路案内
        </a>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center text-sm font-medium text-blue-600 border border-blue-300 py-2 rounded-lg"
        >
          📍 地図を見る
        </a>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onAccept}
          disabled={isLoading}
          className="flex-1 py-3 bg-[#b70011] text-white rounded-lg font-semibold disabled:opacity-50"
        >
          駆けつける
        </button>
        <button
          onClick={onDecline}
          disabled={isLoading}
          className="flex-1 py-3 bg-white text-gray-700 rounded-lg font-semibold border disabled:opacity-50"
        >
          対応不可
        </button>
      </div>
    </div>
  )
}
