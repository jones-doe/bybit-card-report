import { useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
import { maskKey } from '@/lib/credentials'
import { formatDateTime } from '@/lib/format'
import { buildCategoryOrder, buildDays, buildMonths, buildTotals, normalize } from '@/lib/stats'
import { assetRecordsQueryKey, useAssetRecordsQuery } from '@/queries/useAssetRecordsQuery'
import type { Credentials } from '@/requests/shared'

type DashboardProps = {
  credentials: Credentials
  onLogout: () => void
}

export const Dashboard = ({ credentials, onLogout }: DashboardProps) => {
  const queryClient = useQueryClient()
  const { records, total, pagesFetched, isLoading, isFetching, failureCount, error, fetchedAt, refetch } =
    useAssetRecordsQuery(credentials)

  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [tab, setTab] = useState('calendar')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState('all')

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
    total && total > 0 ? Math.min(100, Math.round((records.length / total) * 100)) : null

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Отчёт по Bybit Card</h1>
          <p className="text-muted-foreground text-sm">
            Ключ {maskKey(credentials.apiKey)}
            {fetchedAt ? ` · данные от ${formatDateTime(fetchedAt)}` : ''}
            {records.length > 0 ? ` · ${records.length} записей` : ''}
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
          <Button variant="outline" onClick={refetch} disabled={isFetching}>
            <RefreshCw className={isFetching ? 'animate-spin' : ''} />
            Обновить
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              // Drop this key's cached history, persisted copy included.
              queryClient.removeQueries({ queryKey: assetRecordsQueryKey(credentials.apiKey) })
              onLogout()
            }}
          >
            <LogOut />
            Сменить ключ
          </Button>
        </div>
      </header>

      {isFetching && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-sm tabular-nums">
            <span>
              {failureCount > 0 ? (
                <>
                  Лимит запросов Bybit — жду и повторяю страницу {pagesFetched + 1} (попытка{' '}
                  {failureCount})
                </>
              ) : (
                <>
                  Загружаю историю: страница {pagesFetched + 1}, записей {records.length}
                  {total ? ` из ${total}` : ''}
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
            <p>{error.message}</p>
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

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      )}

      {records.length === 0 && !isFetching && !isLoading && !error && (
        <p className="text-muted-foreground">История пуста.</p>
      )}

      {records.length > 0 && (
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
