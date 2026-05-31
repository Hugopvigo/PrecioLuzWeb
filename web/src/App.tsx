import { useState } from 'react'
import AuroraBackground from './components/AuroraBackground'
import GlassCard from './components/GlassCard'
import HeroPriceCard from './components/HeroPriceCard'
import StatRow from './components/StatRow'
import HourList from './components/HourList'
import LiveIndicator from './components/LiveIndicator'
import { usePrices } from './hooks/usePrices'
import { Zap } from 'lucide-react'

type Tab   = 'today' | 'tomorrow'
type Theme = 'auto'  | 'light' | 'dark'

const THEME_ICONS: Record<Theme, string>  = { auto: '✦', light: '☀️', dark: '🌙' }
const NEXT_THEME:  Record<Theme, Theme>   = { auto: 'light', light: 'dark', dark: 'auto' }

function useDark(theme: Theme): boolean {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return theme === 'auto' ? systemDark : theme === 'dark'
}

export default function App() {
  const [tab,   setTab]   = useState<Tab>('today')
  const [theme, setTheme] = useState<Theme>('auto')
  const { today, tomorrow, updatedAt, isLoading, error } = usePrices()
  const dark = useDark(theme)

  const textMain = dark ? 'rgba(255,255,255,0.90)' : 'rgba(0,0,0,0.85)'
  const textSub  = dark ? 'rgba(255,255,255,0.44)' : 'rgba(0,0,0,0.44)'
  const day      = tab === 'today' ? today : tomorrow

  const dateLabel = (dateStr: string) =>
    new Date(dateStr + 'T12:00:00')
      .toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
      .replace(/^\w/, c => c.toUpperCase())

  return (
    <div className="min-h-screen" style={{ color: textMain }}>
      <AuroraBackground dark={dark} />

      <div className="max-w-lg mx-auto px-4 pb-32">

        {/* ── Header ── */}
        <div className="flex items-center gap-2.5 pt-10 pb-6">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #FFC24D, #FF7A00)' }}
          >
            <Zap size={18} color="white" fill="white" />
          </div>
          <div>
            <p className="font-semibold leading-tight">PrecioLuz</p>
            <p className="text-xs" style={{ color: textSub }}>Precio de la luz · PVPC</p>
          </div>
          <div className="ml-auto">
            <GlassCard dark={dark}>
              <button
                onClick={() => setTheme(NEXT_THEME[theme])}
                className="w-10 h-10 flex items-center justify-center text-lg"
                aria-label="Cambiar tema"
              >
                {THEME_ICONS[theme]}
              </button>
            </GlassCard>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <GlassCard dark={dark} className="p-4 mb-4">
            <p className="text-sm" style={{ color: '#FF3B30' }}>
              No se pudieron cargar los precios. Inténtalo de nuevo.
            </p>
          </GlassCard>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#FF7A00', borderTopColor: 'transparent' }}
            />
          </div>
        )}

        {/* ── Contenido ── */}
        {!isLoading && today && (
          <>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h1 className="text-4xl font-bold">{tab === 'today' ? 'Hoy' : 'Mañana'}</h1>
                <p className="text-sm mt-0.5" style={{ color: textSub }}>
                  {dateLabel(tab === 'today' ? today.date : (tomorrow?.date ?? today.date))}
                </p>
              </div>
              {tab === 'today' && <LiveIndicator />}
            </div>

            {day ? (
              <div className="flex flex-col gap-3.5">
                <HeroPriceCard day={day} isToday={tab === 'today'} dark={dark} />
                <StatRow       day={day} dark={dark} />
                <HourList      day={day} isToday={tab === 'today'} dark={dark} />
              </div>
            ) : (
              <GlassCard dark={dark} className="p-5 text-center">
                <p className="text-sm opacity-60">
                  Los precios de mañana se publican a partir de las 20:15h
                </p>
              </GlassCard>
            )}

            {updatedAt && (
              <p className="text-xs mt-4" style={{ color: textSub }}>
                Datos PVPC · precios con impuestos incluidos · actualizado{' '}
                {new Date(updatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}h
              </p>
            )}
            <p className="text-xs mt-2 pb-4" style={{ color: textSub }}>
              Desarrollado por Hugo Perez-Vigo · Datos de Redeia (REE)
            </p>
          </>
        )}
      </div>

      {/* ── Tab bar flotante ── */}
      {today && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <GlassCard dark={dark} className="flex p-1 gap-1">
            {(['today', 'tomorrow'] as Tab[]).map(t => {
              const disabled = t === 'tomorrow' && !tomorrow
              return (
                <button
                  key={t}
                  onClick={() => !disabled && setTab(t)}
                  className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: tab === t ? (dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)') : 'transparent',
                    color:      tab === t ? textMain : textSub,
                    opacity:    disabled ? 0.4 : 1,
                    cursor:     disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  {t === 'today' ? 'Hoy' : 'Mañana'}
                </button>
              )
            })}
          </GlassCard>
        </div>
      )}
    </div>
  )
}
