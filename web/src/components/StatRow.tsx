import GlassCard from './GlassCard'
import { DayPrices } from '../types'
import { TIER_COLORS_DARK, TIER_COLORS_LIGHT } from '../utils'

interface Props { day: DayPrices; dark: boolean }

export default function StatRow({ day, dark }: Props) {
  const colors    = dark ? TIER_COLORS_DARK : TIER_COLORS_LIGHT
  const textColor = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)'
  const stats = [
    {
      label: 'Mínima 💰',
      price: day.min.priceKwh,
      sub:   `${String(day.min.hour).padStart(2,'0')}–${String(day.min.hour+1).padStart(2,'0')}h`,
      color: colors[day.min.tier],
    },
    {
      label: 'Media',
      price: day.avg,
      sub:   '€/kWh',
      color: textColor,
    },
    {
      label: 'Máxima 💀',
      price: day.max.priceKwh,
      sub:   `${String(day.max.hour).padStart(2,'0')}–${String(day.max.hour+1).padStart(2,'0')}h`,
      color: colors[day.max.tier],
    },
  ]
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {stats.map(s => (
        <GlassCard key={s.label} dark={dark} className="p-3">
          <p className="text-xs opacity-40 mb-1">{s.label}</p>
          <p className="text-lg font-bold tabular-nums" style={{ color: s.color }}>
            {s.price.toFixed(3).replace('.', ',')}
          </p>
          <p className="text-xs opacity-40 mt-0.5">{s.sub}</p>
        </GlassCard>
      ))}
    </div>
  )
}
