import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import './index.css'
import App from './App.tsx'
import {
  PERSISTED_CACHE_MAX_AGE_MS,
  persister,
  queryClient,
  shouldDehydrateQuery,
} from '@/queries/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSISTED_CACHE_MAX_AGE_MS,
        // Bump when the cached shape changes, to drop stale entries on upgrade.
        buster: 'v1',
        dehydrateOptions: { shouldDehydrateQuery },
      }}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
