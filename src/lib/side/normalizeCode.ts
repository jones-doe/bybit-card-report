/** Codes arrive as strings, sometimes padded. */
export const normalizeCode = (value: unknown) => String(value ?? '').trim()
