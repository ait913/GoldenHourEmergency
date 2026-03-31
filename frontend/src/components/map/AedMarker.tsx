'use client'

import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import type { AedItem } from '@/lib/aed'

const aedIcon = L.divIcon({
  html: `<div style="
    background-color: #2563eb;
    color: white;
    font-size: 10px;
    font-weight: bold;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  ">AED</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
})

export default function AedMarker({ id, lat, lng, name, address, distance }: AedItem) {
  const mapsUrl = `https://maps.google.com/maps?daddr=${lat},${lng}`

  return (
    <Marker position={[lat, lng]} icon={aedIcon}>
      <Popup>
        <div className="min-w-[150px]">
          <p className="font-bold text-sm text-blue-700">{name || 'AED'}</p>
          {address && <p className="text-xs text-gray-600 mt-1">{address}</p>}
          <p className="text-xs text-gray-500 mt-1">約 {distance}m</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 text-xs text-blue-600 underline"
          >
            道順（Google Maps）→
          </a>
        </div>
      </Popup>
    </Marker>
  )
}
