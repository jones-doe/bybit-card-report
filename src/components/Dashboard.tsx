import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, LogOut, Moon, RefreshCw, Sun } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarHeatmap } from './CalendarHeatmap'
import { DayDetails } from './DayDetails'
import { MonthsBreakdown } from './MonthsBreakdown'
import { StatTiles } from './StatTiles'
import { TransactionsTable } from './TransactionsTable'
import { fetchAllAssetRecords, type FetchProgress } from '@/lib/bybit'
import { clearCachedRecords, loadCachedRecords, saveCachedRecords } from '@/lib/cache'
import { maskKey, type Credentials } from '@/lib/credentials'
import { formatDateTime } from '@/lib/format'
import { buildCategoryOrder, buildDays, buildMonths, buildTotals, normalize } from '@/lib/stats'
import type { CardAssetRecord } from '@/lib/types'

interface DashboardProps {
  credentials: Credentials
  onLogout: () => void
}

export function Dashboard({ credentials, onLogout }: DashboardProps) {
  const [records, setRecords] = useState<CardAssetRecord[] | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [progress, setProgress] = useState<FetchProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const [tab, setTab] = useState('calendar')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState('all')

  const abortRef = useRef<AbortController | null>(null)
  const startedRef = useRef(false)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    setProgress({ page: 0, fetched: 0, total: null })

    try {
      const all = await fetchAllAssetRecords({
        credentials,
        signal: controller.signal,
        onProgress: setProgress,
      })
      setRecords(all)
      setFetchedAt(Date.now())
      saveCachedRecords(all)
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      // A superseded run must not touch the spinner — the newer one owns it.
      if (abortRef.current === controller) {
        setLoading(false)
        setProgress(null)
      }
    }
  }, [credentials])

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const cached = loadCachedRecords()
    if (cached && cached.records.length > 0) {
      setRecords(cached.records)
      setFetchedAt(cached.fetchedAt)
      return
    }
    void load()
  }, [load])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const txns = useMemo(() => (records ? normalize(records) : []), [records])
  const days = useMemo(() => buildDays(txns), [txns])
  const months = useMemo(() => buildMonths(days), [days])
  const totals = useMemo(() => buildTotals(txns, days), [txns, days])
  const categoryOrder = useMemo(() => buildCategoryOrder(txns), [txns])

  const years = useMemo(() => {
    const set = new Set<number>()
    for (const key of days.keys()) set.add(Number(key.slice(0, 4)))
    return [...set].sort((a, b) => b - a)
  }, [days])

  useEffect(() => {
    if (years.length > 0 && !years.includes(year)) setYear(years[0])
  }, [years, year])

  const selectedDayStat = selectedDay ? (days.get(selectedDay) ?? null) : null

  const percent =
    progress && progress.total
      ? Math.min(100, Math.round((progress.fetched / progress.total) * 100))
      : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Отчёт по Bybit Card</h1>
          <p className="text-muted-foreground text-sm">
            Ключ {maskKey(credentials.apiKey)}
            {fetchedAt ? ` · данные от ${formatDateTime(fetchedAt)}` : ''}
            {records ? ` · ${records.length} записей` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDark((v) => !v)}
            aria-label="Переключить тему"
          >
            {dark ? <Sun /> : <Moon />}
          </Button>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={loading ? 'animate-spin' : ''} />
            Обновить
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              abortRef.current?.abort()
              clearCachedRecords()
              onLogout()
            }}
          >
            <LogOut />
            Сменить ключ
          </Button>
        </div>
      </header>

      {loading && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm tabular-nums">
            <span>
              {progress?.retry ? (
                <>
                  Лимит запросов Bybit — жду {progress.retry.secondsLeft} с и повторяю страницу{' '}
                  {progress.page} (попытка {progress.retry.attempt})
                </>
              ) : (
                <>
                  Загружаю историю: страница {progress?.page ?? 0}, записей {progress?.fetched ?? 0}
                  {progress?.total ? ` из ${progress.total}` : ''}
                </>
              )}
            </span>
            {percent !== null && <span>{percent}%</span>}
          </div>
          <Progress value={percent ?? undefined} />
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Не удалось загрузить историю</AlertTitle>
          <AlertDescription>
            <p>{error}</p>
            <p className="text-xs">
              Коды 10003/10004/10005 означают проблему с ключом, подписью или правами — проверьте,
              что ключ активен и у него есть доступ к разделу Bybit Card. Код 10006 — лимит
              запросов: приложение само выжидает и повторяет страницу, эта ошибка означает, что
              лимит не отпустил и после всех повторов.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {totals.unresolvedCount > 0 && (
        <Alert>
          <AlertCircle />
          <AlertTitle>Часть записей без суммы в USD</AlertTitle>
          <AlertDescription>
            {totals.unresolvedCount} из {totals.count} операций не содержат USD-суммы и не попали в
            статистику. В таблице они помечены как «нет USD».
          </AlertDescription>
        </Alert>
      )}

      {!records && loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {records && records.length === 0 && !loading && (
        <p className="text-muted-foreground">История пуста.</p>
      )}

      {records && records.length > 0 && (
        <>
          <StatTiles totals={totals} />

          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="calendar">Календарь</TabsTrigger>
              <TabsTrigger value="months">Месяцы</TabsTrigger>
              <TabsTrigger value="transactions">Транзакции</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-4">
              {selectedDayStat && (
                <DayDetails day={selectedDayStat} onClose={() => setSelectedDay(null)} />
              )}
              <CalendarHeatmap
                days={days}
                years={years}
                year={year}
                onYearChange={setYear}
                selectedDay={selectedDay}
                onSelectDay={setSelectedDay}
              />
            </TabsContent>

            <TabsContent value="months">
              <MonthsBreakdown
                months={months}
                categoryOrder={categoryOrder}
                onOpenTransactions={(monthKey) => {
                  setMonthFilter(monthKey)
                  setTab('transactions')
                }}
              />
            </TabsContent>

            <TabsContent value="transactions">
              <TransactionsTable
                txns={txns}
                months={months.map((m) => m.monthKey)}
                monthFilter={monthFilter}
                onMonthFilterChange={setMonthFilter}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
