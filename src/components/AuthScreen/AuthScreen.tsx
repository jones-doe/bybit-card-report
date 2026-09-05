import { useState, type FormEvent } from 'react'
import { FlaskConical, KeyRound, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import type { Credentials } from '@/requests/shared'
import { installDemoData } from './utils'

type AuthScreenProps = {
  onSubmit: (credentials: Credentials) => void
}

export const AuthScreen = ({ onSubmit }: AuthScreenProps) => {
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const handleDemoMode = async () => {
    setIsDemoLoading(true)
    setError(null)
    try {
      await installDemoData()
    } catch {
      setError('Не удалось загрузить демо-данные — dev/fixtures/assetRecords.json недоступен.')
    } finally {
      setIsDemoLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const key = apiKey.trim()
    const secret = apiSecret.trim()
    if (!key || !secret) {
      setError('Заполните оба поля.')
      return
    }
    setError(null)
    onSubmit({ apiKey: key, apiSecret: secret })
  }

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
            <KeyRound className="size-5" />
          </div>
          <CardTitle>Отчёт по Bybit Card</CardTitle>
          <CardDescription>
            Введите API Key и API Secret — приложение подпишет запросы к{' '}
            <code className="text-xs">/v5/card/transaction/query-asset-records</code> и выгрузит
            всю историю постранично.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="XXXXXXXXXXXXXXXXXXXX"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••••••••••"
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}

            <Alert>
              <ShieldAlert />
              <AlertTitle>Ключи хранятся локально</AlertTitle>
              <AlertDescription>
                Пара сохраняется в localStorage этого браузера в открытом виде. Запросы уходят
                напрямую на api.bybit.com — своего сервера у приложения нет, ключи никуда больше
                не передаются. Используйте ключ с правами только на чтение.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full">
              Загрузить историю
            </Button>

            {import.meta.env.DEV && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isDemoLoading}
                onClick={handleDemoMode}
              >
                <FlaskConical className={isDemoLoading ? 'animate-pulse' : ''} />
                Демо-режим (dev)
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
