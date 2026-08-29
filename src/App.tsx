import { useStore } from '@nanostores/react'
import { AuthScreen } from '@/components/AuthScreen'
import { Dashboard } from '@/components/Dashboard'
import { credentialsStore } from '@/lib/credentials'

export default function App() {
  const credentials = useStore(credentialsStore)

  if (!credentials) {
    return <AuthScreen onSubmit={(next) => credentialsStore.set(next)} />
  }

  return <Dashboard credentials={credentials} onLogout={() => credentialsStore.set(null)} />
}
