export type Symptom =
  | '息をしていない'
  | '血を流している'
  | '意識がない'
  | 'けいれんしている'
  | '胸を押さえている'

export interface User {
  id: number
  phoneNumber: string
  name: string | null
  role: 'REPORTER' | 'MEDICAL'
}

export interface Emergency {
  id: number
  reporterId: number
  symptoms: Symptom[]
  lat: number
  lng: number
  status: 'PENDING' | 'RESPONDING' | 'RESOLVED' | 'CANCELLED'
  createdAt: string
  responses: EmergencyResponseSummary[]
}

export interface EmergencyResponseSummary {
  responderId: number
  responderName: string | null
  action: 'ACCEPTED' | 'DECLINED'
}

export interface NearbyMedical {
  userId: number
  distanceMeters: number
}

// JWTペイロード型
export interface JwtPayload {
  userId: number
  role: 'REPORTER' | 'MEDICAL'
  exp?: number
}

// SSEイベント型
export type SSEEvent =
  | { type: 'emergency'; data: Emergency & { distanceMeters: number } }
  | {
      type: 'response_update'
      data: { emergencyId: number; responses: EmergencyResponseSummary[] }
    }
  | { type: 'ping' }
