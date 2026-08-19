export function maskKey(apiKey: string) {
  if (apiKey.length <= 8) return '•'.repeat(apiKey.length)
  return `${apiKey.slice(0, 4)}…${apiKey.slice(-4)}`
}
