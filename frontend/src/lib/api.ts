import { getToken } from './auth'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(res.status, errorBody.error || 'Request failed')
  }

  return res.json()
}

// 認証API
export const authApi = {
  sendOtp: (phoneNumber: string) =>
    apiFetch<{ message: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber }),
    }),

  verifyOtp: (
    phoneNumber: string,
    otp: string,
    role: 'reporter' | 'medical'
  ) =>
    apiFetch<{
      token: string
      user: { id: number; phoneNumber: string; name: string | null; role: string }
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, otp, role }),
    }),
}

// 緊急通報API
export const emergencyApi = {
  create: (lat: number, lng: number, symptoms: string[]) =>
    apiFetch<{ emergencyId: number }>('/emergency', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, symptoms }),
    }),

  get: (id: number) => apiFetch<{ id: number; status: string; responses: unknown[] }>(`/emergency/${id}`),

  respond: (emergencyId: number, action: 'accept' | 'decline') =>
    apiFetch<{ message: string }>(`/emergency/${emergencyId}/response`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    }),
}

// 位置情報API
export const locationApi = {
  update: (lat: number, lng: number) =>
    apiFetch<{ message: string }>('/location', {
      method: 'PUT',
      body: JSON.stringify({ lat, lng }),
    }),
}
