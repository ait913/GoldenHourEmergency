'use client'

import { MapContainer, TileLayer } from 'react-leaflet'
import UserMarker from './UserMarker'
import AedMarker from './AedMarker'
import ResponderMarker, { type ResponderItem } from './ResponderMarker'
import type { AedItem } from '@/lib/aed'

interface EmergencyMapProps {
  userLat: number
  userLng: number
  aeds: AedItem[]
  responders: ResponderItem[]
}

export default function EmergencyMap({
  userLat,
  userLng,
  aeds,
  responders,
}: EmergencyMapProps) {
  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={16}
      style={{ height: '55vh', width: '100%' }}
      data-testid="emergency-map"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* 通報者位置（赤） */}
      <UserMarker lat={userLat} lng={userLng} />

      {/* AEDマーカー（青） */}
      {aeds.map((aed) => (
        <AedMarker key={aed.id} {...aed} />
      ))}

      {/* 救助者マーカー（緑） */}
      {responders
        .filter((r) => r.action === 'ACCEPTED')
        .map((responder) => (
          <ResponderMarker
            key={responder.responderId}
            {...responder}
            userLat={userLat}
            userLng={userLng}
          />
        ))}
    </MapContainer>
  )
}
