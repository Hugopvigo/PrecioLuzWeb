import Card from './Card'
import { DayPrices, PriceLevel } from '../types'
import { LEVEL_LABELS, TRAMO_LABELS, formatPrice, hh } from '../utils'

interface Props { day: DayPrices; nowHour: number | null }

const PILL: Record<PriceLevel, string> = {
  LOW:  'bg-low/20 text-low',
  MID:  'bg-ink/5 text-muted',
  HIGH: 'bg-high/20 text-high',
}

function versusAverage(price: number, avg: number): string {
  const diff = Math.round((price / avg - 1) * 100)
  if (diff === 0) return `En la media de hoy (${formatPrice(avg, 3)})`
  return `${Math.abs(diff)} % por ${diff < 0 ? 'debajo' : 'encima'} de la media de hoy (${formatPrice(avg, 3)})`
}

export default function NowCard({ day, nowHour }: Props) {
  const now = nowHour !== null ? day.hours[nowHour] : undefined

  return (
    <Card className="p-5">
      <p className="text-sm text-muted">
        {now
          ? `Ahora · ${hh(now.hour)}–${hh(now.hour + 1)} h · ${TRAMO_LABELS[now.tramo]}`
          : 'Precio medio del día'}
      </p>
      <div className="flex items-baseline gap-2 mt-1 flex-wrap">
        <span className="text-5xl font-bold tabular-nums tracking-tight">
          {formatPrice(now?.priceKwh ?? day.avg)}
        </span>
        <span className="text-base text-muted">€/kWh</span>
      </div>
      {now && (
        <div className="flex items-center gap-2 mt-3 flex-wrap text-sm">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PILL[now.level]}`}>
            {LEVEL_LABELS[now.level]}
          </span>
          <span className="text-muted">{versusAverage(now.priceKwh, day.avg)}</span>
        </div>
      )}
    </Card>
  )
}
