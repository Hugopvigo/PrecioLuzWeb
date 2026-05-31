import GlassCard from './GlassCard'
import { DayPrices, PriceTier } from '../types'
import { TIER_COLORS_DARK, TIER_COLORS_LIGHT, TIER_LABELS, TRAMO_LABELS } from '../utils'

interface Props { day: DayPrices; isToday: boolean; dark: boolean }

export default function HourList({ day, isToday, dark }: Props) {
  const colors      = dark ? TIER_COLORS_DARK : TIER_COLORS_LIGHT
  const currentHour = isToday ? new Date().getHours() : -1
  const maxPrice    = day.max.priceKwh
  const cheapest3   = new Set([...day.hours].sort((a,b) => a.priceKwh - b.priceKwh).slice(0,3).map(h => h.hour))
  const dearest3    = new Set([...day.hours].sort((a,b) => b.priceKwh - a.priceKwh).slice(0,3).map(h => h.hour))
  const dimText     = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)'
  const dimBg       = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
  const dividerColor = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)'

  return (
    <GlassCard dark={dark} className="w-full">
      <div className="p-4">
        <p className="font-semibold mb-3" style={{ color: dark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)' }}>
          Todas las horas
        </p>
        <div className="flex gap-3 mb-3 flex-wrap">
          {(['GREEN','YELLOW','ORANGE','RED'] as PriceTier[]).map(t => (
            <span key={t} className="flex items-center gap-1 text-xs opacity-60">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[t] }} />
              {TIER_LABELS[t]}
            </span>
          ))}
        </div>
        {day.hours.map((h, i) => {
          const color      = colors[h.tier]
          const isNow      = h.hour === currentHour
          const pct        = (h.priceKwh / maxPrice) * 100
          const mark       = cheapest3.has(h.hour) ? '💰' : dearest3.has(h.hour) ? '💀' : ''
          const priceColor = (cheapest3.has(h.hour) || dearest3.has(h.hour)) ? color : dimText
          return (
            <div key={h.hour}>
              <div
                className="flex items-center gap-2 py-2 px-2 rounded-xl text-sm"
                style={{ background: isNow ? dimBg : 'transparent' }}
              >
                <span className="w-8 shrink-0 tabular-nums opacity-80">{String(h.hour).padStart(2,'0')}h</span>
                <span className="flex items-center gap-1 w-16 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs opacity-60 truncate">{TRAMO_LABELS[h.tramo]}</span>
                </span>
                <div className="flex-1 h-1.5 rounded-full" style={{ background: dimBg }}>
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                <span className="w-5 text-center shrink-0 text-base leading-none">{mark}</span>
                <span className="w-16 text-right tabular-nums shrink-0 font-medium" style={{ color: priceColor }}>
                  {h.priceKwh.toFixed(4).replace('.', ',')} €
                </span>
              </div>
              {i < 23 && <hr style={{ borderColor: dividerColor, margin: 0 }} />}
            </div>
          )
        })}
      </div>
    </GlassCard>
  )
}
