'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

interface UserMarkerProps {
  lat: number
  lng: number
}

const userIcon = L.divIcon({
  html: `<div style="
    background-color: #dc2626;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
  "></div>`,
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

export default function UserMarker({ lat, lng }: UserMarkerProps) {
  return (
    <Marker position={[lat, lng]} icon={userIcon}>
      <Popup>
        <p className="text-sm font-medium">あなたの位置</p>
      </Popup>
    </Marker>
  )
}
