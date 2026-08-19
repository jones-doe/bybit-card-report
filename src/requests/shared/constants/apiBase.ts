/**
 * Bybit serves CORS headers on the card endpoints and allows the X-BAPI-*
 * request headers, so the browser calls the API directly. Set
 * VITE_BYBIT_BASE=/bybit to route through the dev-server proxy instead.
 */
export const API_BASE = import.meta.env.VITE_BYBIT_BASE ?? 'https://api.bybit.com'
