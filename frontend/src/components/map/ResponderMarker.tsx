'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

export interface ResponderItem {
  responderId: number
  responderName: string | null
  action: 'ACCEPTED' | 'DECLINED'
  lat?: number
  lng?: number
  distance?: number
}

interface ResponderMarkerProps extends ResponderItem {
  userLat: number
  userLng: number
}

const responderIcon = L.divIcon({
  html: `<div style="
    background-color: #16a34a;
    color: white;
    font-size: 9px;
    font-weight: bold;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">救助</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function ResponderMarker({
  responderName,
  action,
  lat,
  lng,
  distance,
  userLat,
  userLng,
}: ResponderMarkerProps) {
  // 座標がない場合は通報者位置のわずかなオフセットに表示（暫定）
  const markerLat = lat ?? userLat + 0.001
  const markerLng = lng ?? userLng + 0.001

  return (
    <Marker position={[markerLat, markerLng]} icon={responderIcon}>
      <Popup>
        <div className="min-w-[130px]">
          <p className="font-bold text-sm text-green-700">
            {responderName || '医療従事者'}
          </p>
          {distance !== undefined && (
            <p className="text-xs text-gray-500 mt-1">約 {distance}m</p>
          )}
          <p className="text-xs text-green-600 mt-1">
            {action === 'ACCEPTED' ? '✓ 向かっています' : ''}
          </p>
        </div>
      </Popup>
    </Marker>
  )
}
