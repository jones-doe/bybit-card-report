const KEY = 'bybit-card-report:credentials'

export interface Credentials {
  apiKey: string
  apiSecret: string
}

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Credentials>
    if (!parsed.apiKey || !parsed.apiSecret) return null
    return { apiKey: parsed.apiKey, apiSecret: parsed.apiSecret }
  } catch {
    return null
  }
}

export function saveCredentials(credentials: Credentials) {
  localStorage.setItem(KEY, JSON.stringify(credentials))
}

export function clearCredentials() {
  localStorage.removeItem(KEY)
}

export function maskKey(apiKey: string) {
  if (apiKey.length <= 8) return '•'.repeat(apiKey.length)
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`
}
