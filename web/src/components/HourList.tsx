import { useState } from 'react'
import Card from './Card'
import { DayPrices, PriceLevel } from '../types'
import { LEVEL_LABELS, TRAMO_LABELS, formatPrice, hh } from '../utils'

interface Props { day: DayPrices; nowHour: number | null; defaultOpen: boolean }

const LEVEL_TEXT: Record<PriceLevel, string> = { LOW: 'text-low', MID: 'text-muted', HIGH: 'text-high' }

export default function HourList({ day, nowHour, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="px-5 py-2">
      <details open={open} onToggle={e => setOpen(e.currentTarget.open)}>
        <summary className="py-3 cursor-pointer font-semibold">
          Las {day.hours.length} horas
        </summary>
        <ul className="pb-3 text-sm tabular-nums">
          {day.hours.map(h => {
            const isNow = h.hour === nowHour
            const past  = nowHour !== null && h.hour < nowHour
            return (
              <li
                key={h.hour}
                className={`grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-2 px-2 py-2 rounded-lg ${
                  isNow ? 'bg-now font-semibold' : 'border-b border-line/60 last:border-0'
                } ${past ? 'opacity-55' : ''}`}
              >
                <span>{hh(h.hour)}–{hh(h.hour + 1)} h</span>
                <span className="truncate">
                  <span className={LEVEL_TEXT[h.level]}>{LEVEL_LABELS[h.level]}</span>
                  <span className="text-muted"> · {TRAMO_LABELS[h.tramo]}{isNow ? ' · ahora' : ''}</span>
                </span>
                <span>{formatPrice(h.priceKwh)} €</span>
              </li>
            )
          })}
        </ul>
      </details>
    </Card>
  )
}
