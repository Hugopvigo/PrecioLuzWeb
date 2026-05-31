import GlassCard from './GlassCard'
import { DayPrices } from '../types'
import { TIER_COLORS_DARK, TIER_COLORS_LIGHT, TIER_LABELS, TRAMO_LABELS } from '../utils'

interface Props { day: DayPrices; isToday: boolean; dark: boolean }

export default function HeroPriceCard({ day, isToday, dark }: Props) {
  const currentHour = new Date().getHours()
  const hourData    = isToday ? day.hours[currentHour] : null
  const price       = hourData?.priceKwh ?? day.avg
  const tier        = hourData?.tier ?? day.min.tier
  const colors      = dark ? TIER_COLORS_DARK : TIER_COLORS_LIGHT
  const color       = colors[tier]

  const label = isToday
    ? `Ahora · ${String(currentHour).padStart(2,'0')}–${String(currentHour+1).padStart(2,'0')}h`
    : 'Precio medio · mañana'

  const nextHour   = (currentHour + 1) % 24
  const trendUp    = isToday && day.hours[nextHour].priceKwh >= day.hours[currentHour].priceKwh
  const trendColor = dark
    ? (trendUp ? TIER_COLORS_DARK.RED   : TIER_COLORS_DARK.GREEN)
    : (trendUp ? TIER_COLORS_LIGHT.RED  : TIER_COLORS_LIGHT.GREEN)

  return (
    <GlassCard dark={dark} className="relative overflow-hidden w-full">
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse at 88% 0%, ${color}44 0%, transparent 70%)`,
      }} />
      <div className="relative p-5">
        <p className="text-sm opacity-60">{label}</p>
        <div className="flex items-end gap-2 mt-1">
          <span className="text-5xl font-bold tabular-nums" style={{ color }}>
            {price.toFixed(4).replace('.', ',')}
          </span>
          <span className="text-lg opacity-60 mb-1">€/kWh</span>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full" style={{ background: `${color}22`, color }}>
            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
            {TIER_LABELS[tier]}
          </span>
          {hourData && (
            <span className="text-xs px-2.5 py-1 rounded-full opacity-70" style={{ background: 'rgba(128,128,128,0.15)' }}>
              {TRAMO_LABELS[hourData.tramo]}
            </span>
          )}
          {isToday && hourData && (
            <span className="text-xs font-medium" style={{ color: trendColor }}>
              {trendUp ? '↑' : '↓'} {trendUp ? 'Sube' : 'Baja'} a las {String(nextHour).padStart(2,'0')}:00
            </span>
          )}
          {!isToday && (
            <span className="text-xs opacity-60">
              Mín {day.min.priceKwh.toFixed(4).replace('.', ',')} · Máx {day.max.priceKwh.toFixed(4).replace('.', ',')}
            </span>
          )}
        </div>
      </div>
    </GlassCard>
  )
}
