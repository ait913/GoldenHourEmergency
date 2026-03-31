const TOKEN_KEY = 'golden_hour_token'

/**
 * JWTトークンをlocalStorageに保存する
 */
export function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

/**
 * JWTトークンをlocalStorageから取得する
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * JWTトークンを削除する（ログアウト）
 */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

/**
 * JWTのペイロードをデコードする（検証なし）
 */
export function decodeToken(
  token: string
): { userId: number; role: string; exp: number } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    )
    return payload
  } catch {
    return null
  }
}

/**
 * トークンが有効期限内かどうかを確認する
 */
export function isTokenValid(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload) return false
  return payload.exp > Date.now() / 1000
}
