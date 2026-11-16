import { useEffect, useState } from 'react'
import Card from './components/Card'
import NowCard from './components/NowCard'
import BestWindow from './components/BestWindow'
import DayChart from './components/DayChart'
import HourList from './components/HourList'
import { usePrices } from './hooks/usePrices'
import { cheapestWindow } from './utils'
import { Monitor, Moon, Sun, Zap } from 'lucide-react'

type Tab   = 'today' | 'tomorrow'
type Theme = 'auto'  | 'light' | 'dark'

const TABS: { id: Tab; label: string }[] = [
  { id: 'today',    label: 'Hoy' },
  { id: 'tomorrow', label: 'Mañana' },
]

const THEME_ICONS = { auto: Monitor, light: Sun, dark: Moon }
const THEME_NAMES: Record<Theme, string> = { auto: 'automático', light: 'claro', dark: 'oscuro' }
const NEXT_THEME:  Record<Theme, Theme>  = { auto: 'light', light: 'dark', dark: 'auto' }

// A partir de este ancho la página pasa a dos columnas (mismo corte que min-[900px] en las clases).
const isDesktop = () => window.matchMedia('(min-width: 900px)').matches

// index.html ya ha puesto data-theme antes de pintar si había un tema guardado.
function initialTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return t === 'light' || t === 'dark' ? t : 'auto'
}

function useCurrentHour(): number {
  const [hour, setHour] = useState(() => new Date().getHours())
  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 30_000)
    return () => clearInterval(id)
  }, [])
  return hour
}

const dateLabel = (dateStr: string) =>
  new Date(dateStr + 'T12:00:00')
    .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase())

export default function App() {
  const [tab,      setTab]      = useState<Tab>('today')
  const [theme,    setTheme]    = useState<Theme>(initialTheme)
  const [duration, setDuration] = useState(2)
  const { today, tomorrow, updatedAt, isLoading, error } = usePrices()
  const currentHour = useCurrentHour()

  useEffect(() => {
    const root = document.documentElement
    try {
      if (theme === 'auto') {
        delete root.dataset.theme
        localStorage.removeItem('theme')
      } else {
        root.dataset.theme = theme
        localStorage.setItem('theme', theme)
      }
    } catch { /* sin almacenamiento: el tema vale para esta visita */ }
  }, [theme])

  const day       = tab === 'today' ? today : tomorrow
  const nowHour   = tab === 'today' ? currentHour : null
  const best      = day ? cheapestWindow(day.hours, nowHour ?? 0, duration) : null
  const ThemeIcon = THEME_ICONS[theme]

  return (
    <div className="mx-auto max-w-lg sm:max-w-2xl min-[900px]:max-w-[1040px] px-4 pb-10">

      {/* ── Cabecera ── */}
      <header className="flex items-center gap-2.5 pt-6 pb-6 min-[900px]:pt-10">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFC24D, #FF7A00)' }}
        >
          <Zap size={18} color="white" fill="white" />
        </div>
        <div>
          <p className="font-semibold leading-tight">PrecioLuz</p>
          <p className="text-xs text-muted">Precio de la luz · PVPC</p>
        </div>
        <button
          onClick={() => setTheme(NEXT_THEME[theme])}
          className="ml-auto w-11 h-11 flex items-center justify-center rounded-2xl border border-line bg-surface cursor-pointer"
          aria-label={`Tema ${THEME_NAMES[theme]}. Cambiar tema`}
          title={`Tema ${THEME_NAMES[theme]}`}
        >
          <ThemeIcon size={18} />
        </button>
      </header>

      {error && (
        <Card className="p-4 mb-4">
          <p className="text-sm text-high">
            No se pudieron cargar los precios. Recarga la página para volver a intentarlo.
          </p>
        </Card>
      )}

      {isLoading && (
        <div className="flex justify-center py-20" role="status">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <span className="sr-only">Cargando precios…</span>
        </div>
      )}

      {today && (
        <main>
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <h1 className="text-3xl font-bold">{tab === 'today' ? 'Hoy' : 'Mañana'}</h1>
              {day && <p className="text-sm mt-0.5 text-muted">{dateLabel(day.date)}</p>}
            </div>
            <div className="flex rounded-2xl border border-line bg-surface p-1 gap-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  aria-pressed={tab === t.id}
                  className={`min-h-11 px-4 rounded-xl text-sm font-medium cursor-pointer ${
                    tab === t.id ? 'bg-ink text-surface' : 'text-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {day ? (
            <div className="grid gap-3.5 items-start min-[900px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
              <div className="flex flex-col gap-3.5">
                <NowCard day={day} nowHour={nowHour} />
                <BestWindow day={day} nowHour={nowHour} duration={duration} onDuration={setDuration} best={best} />
              </div>
              <div className="flex flex-col gap-3.5">
                <DayChart key={`chart-${day.date}`} day={day} nowHour={nowHour} best={best} />
                <HourList key={`list-${day.date}`} day={day} nowHour={nowHour} defaultOpen={isDesktop()} />
              </div>
            </div>
          ) : (
            <Card className="p-5">
              <p className="text-sm text-muted">
                Los precios de mañana se publican a partir de las 20:15.
              </p>
            </Card>
          )}

          <footer className="text-xs text-muted mt-5 flex flex-col gap-1">
            {updatedAt && (
              <p>
                Datos PVPC · precios con impuestos incluidos · actualizado a las{' '}
                {new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            <p>Desarrollado por Hugo Perez-Vigo · Datos de Redeia (REE)</p>
          </footer>
        </main>
      )}
    </div>
  )
}
