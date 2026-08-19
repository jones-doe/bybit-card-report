import { useState } from 'react'
import { AuthScreen } from '@/components/AuthScreen'
import { Dashboard } from '@/components/Dashboard'
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
  type Credentials,
} from '@/lib/credentials'

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())

  if (!credentials) {
    return (
      <AuthScreen
        onSubmit={(next) => {
          saveCredentials(next)
          setCredentials(next)
        }}
      />
    )
  }

  return (
    <Dashboard
      credentials={credentials}
      onLogout={() => {
        clearCredentials()
        setCredentials(null)
      }}
    />
  )
}
