import { persistentBoolean } from '@nanostores/persistent'

/** Dark theme, persisted to localStorage and synced across tabs. */
export const themeStore = persistentBoolean('bybit-card-report:dark-theme', false)
