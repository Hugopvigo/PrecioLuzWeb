import Card from './Card'
import { DayPrices, PriceWindow } from '../types'
import { formatPrice, hh } from '../utils'

interface Props {
  day: DayPrices
  nowHour: number | null
  duration: number
  onDuration: (hours: number) => void
  best: PriceWindow | null
}

const DURATIONS = [1, 2, 3]

export default function BestWindow({ day, nowHour, duration, onDuration, best }: Props) {
  let headline: string
  let detail: string

  if (!best) {
    headline = `Hoy ya no quedan ${duration} horas seguidas.`
    detail   = 'Prueba con menos tiempo o mira los precios de mañana.'
  } else if (nowHour === null) {
    headline = `De ${hh(best.start)}:00 a ${hh(best.start + duration)}:00.`
    detail   = `Media ${formatPrice(best.avg)} €/kWh.`
  } else if (best.start === nowHour) {
    headline = 'Ahora mismo.'
    detail   = 'No queda una franja mejor hoy.'
  } else {
    const fromNow = day.hours.slice(nowHour, nowHour + duration)
    const nowAvg  = fromNow.reduce((s, h) => s + h.priceKwh, 0) / fromNow.length
    const saving  = nowAvg > 0 ? Math.round((1 - best.avg / nowAvg) * 100) : 0
    headline = `Espera a las ${hh(best.start)}:00 (hasta las ${hh(best.start + duration)}:00).`
    detail   = `Media ${formatPrice(best.avg)} €/kWh` +
      (saving > 0 ? `, un ${saving} % menos que empezando ahora.` : '.')
  }

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-sm text-muted">¿Cuánto dura lo que vas a poner?</h2>
        <div className="flex rounded-xl border border-line p-0.5 gap-0.5">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => onDuration(d)}
              aria-pressed={duration === d}
              className={`min-w-11 min-h-10 px-2 rounded-[10px] text-sm font-medium cursor-pointer ${
                duration === d ? 'bg-ink text-surface' : 'text-muted'
              }`}
            >
              {d} h
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className={`text-lg font-semibold ${best ? 'text-low' : ''}`}>{headline}</p>
        <p className="text-sm text-muted">{detail}</p>
      </div>
    </Card>
  )
}
