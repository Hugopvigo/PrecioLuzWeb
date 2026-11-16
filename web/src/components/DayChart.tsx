import { PointerEvent, useState } from 'react'
import Card from './Card'
import { DayPrices, PriceLevel, PriceWindow, Tramo } from '../types'
import { LEVEL_LABELS, TRAMO_LABELS, formatPrice, hh } from '../utils'

interface Props { day: DayPrices; nowHour: number | null; best: PriceWindow | null }

const BAR: Record<PriceLevel, string> = { LOW: 'bg-low', MID: 'bg-mid', HIGH: 'bg-high' }
const TRAMO_BAR: Record<Tramo, string> = { VALLE: 'bg-line', LLANO: 'bg-mid', PUNTA: 'bg-ink' }

export default function DayChart({ day, nowHour, best }: Props) {
  const [selected, setSelected] = useState(nowHour ?? day.min.hour)
  const count   = day.hours.length
  const scale   = day.max.priceKwh || 1
  const columns = { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }
  const sel     = day.hours[selected]

  const inBest = (hour: number) => !!best && hour >= best.start && hour < best.start + best.length

  // En móvil las barras son demasiado estrechas para acertar: se lee arrastrando el dedo.
  const scrub = (e: PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const i   = Math.floor(((e.clientX - box.left) / box.width) * count)
    setSelected(Math.min(count - 1, Math.max(0, i)))
  }

  // Etiquetas del eje: la hora actual y cada seis horas, salvo las que chocarían con ella.
  const axisLabel = (hour: number) => {
    if (hour === nowHour) return hh(hour)
    if (hour % 6 !== 0) return ''
    return nowHour !== null && Math.abs(hour - nowHour) === 1 ? '' : hh(hour)
  }

  const when = nowHour === null ? '' : selected === nowHour ? ' · ahora' : selected < nowHour ? ' · ya pasó' : ''

  return (
    <Card className="p-5 flex flex-col gap-3">
      <h2 className="font-semibold">Precio por horas</h2>

      <div className="flex flex-col gap-1">
        <div
          className="relative grid gap-0.5 items-end h-40 min-[900px]:h-56 touch-pan-y"
          style={columns}
          onPointerMove={scrub}
          onPointerDown={scrub}
        >
          {day.hours.map(h => (
            <button
              key={h.hour}
              onFocus={() => setSelected(h.hour)}
              aria-label={`${hh(h.hour)} h: ${formatPrice(h.priceKwh)} euros por kilovatio hora, ${LEVEL_LABELS[h.level]}`}
              className={`h-full flex items-end rounded cursor-pointer ${
                h.hour === nowHour ? 'bg-now' : inBest(h.hour) ? 'bg-low/15' : ''
              }`}
            >
              <span
                className={`block w-full min-h-[3px] rounded-t-sm ${BAR[h.level]} ${
                  nowHour !== null && h.hour < nowHour ? 'opacity-40' : ''
                } ${h.hour === selected ? 'outline-2 outline-offset-1 outline-ink' : ''}`}
                style={{ height: `${(h.priceKwh / scale) * 100}%` }}
              />
            </button>
          ))}
          <div
            className="absolute inset-x-0 border-t border-dashed border-muted pointer-events-none"
            style={{ bottom: `${(day.avg / scale) * 100}%` }}
          >
            <span className="absolute right-0 bottom-0.5 px-1 text-[11px] text-muted bg-surface">
              media {formatPrice(day.avg, 3)}
            </span>
          </div>
        </div>

        <div className="grid gap-0.5" style={columns} aria-hidden="true">
          {day.hours.map(h => (
            <span key={h.hour} className={`h-1.5 rounded-sm ${TRAMO_BAR[h.tramo]}`} />
          ))}
        </div>
        <div className="grid gap-0.5" style={columns} aria-hidden="true">
          {day.hours.map(h => (
            <span
              key={h.hour}
              className={`text-[11px] text-center tabular-nums whitespace-nowrap ${
                h.hour === nowHour ? 'text-accent font-semibold' : 'text-muted'
              }`}
            >
              {axisLabel(h.hour)}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm tabular-nums rounded-lg bg-bg px-3 py-2" aria-live="polite">
        <span className="font-semibold">{hh(sel.hour)}–{hh(sel.hour + 1)} h</span>
        {' · '}{formatPrice(sel.priceKwh)} €/kWh · {LEVEL_LABELS[sel.level]} · {TRAMO_LABELS[sel.tramo]}{when}
      </p>

      <div className="flex gap-x-4 gap-y-1 flex-wrap text-xs text-muted">
        {(['VALLE', 'LLANO', 'PUNTA'] as Tramo[]).map(t => (
          <span key={t} className="flex items-center gap-1.5">
            <span className={`w-3.5 h-1.5 rounded-sm ${TRAMO_BAR[t]}`} />
            {TRAMO_LABELS[t]}
          </span>
        ))}
      </div>

      <p className="text-sm text-muted">
        Mínima <span className="font-semibold tabular-nums text-low">{formatPrice(day.min.priceKwh, 3)}</span> a las {hh(day.min.hour)} h
        {' · '}
        Máxima <span className="font-semibold tabular-nums text-high">{formatPrice(day.max.priceKwh, 3)}</span> a las {hh(day.max.hour)} h
      </p>
    </Card>
  )
}
