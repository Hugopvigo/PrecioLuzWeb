import type { DayPrices, HourPrice, PriceLevel, PriceWindow, Tramo } from './types'

export const LEVEL_LABELS: Record<PriceLevel, string> = {
  LOW:  'Barato',
  MID:  'Normal',
  HIGH: 'Caro',
}

export const TRAMO_LABELS: Record<Tramo, string> = {
  VALLE: 'Valle',
  LLANO: 'Llano',
  PUNTA: 'Punta',
}

export const hh = (hour: number) => String(hour % 24).padStart(2, '0')

export const formatPrice = (price: number, decimals = 4) =>
  price.toFixed(decimals).replace('.', ',')

// Una hora es barata o cara si se aparta más de un 15 % de la media del día.
const LEVEL_MARGIN = 0.15

export function levelFor(price: number, avg: number): PriceLevel {
  if (price < avg * (1 - LEVEL_MARGIN)) return 'LOW'
  if (price > avg * (1 + LEVEL_MARGIN)) return 'HIGH'
  return 'MID'
}

export function tramoForHour(hour: number, dateStr: string): Tramo {
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  if (dow === 0 || dow === 6) return 'VALLE'
  if ((hour >= 10 && hour <= 13) || (hour >= 18 && hour <= 21)) return 'PUNTA'
  if (hour < 8) return 'VALLE'
  return 'LLANO'
}

const mean = (values: number[]) => values.reduce((s, v) => s + v, 0) / values.length

export function buildDayPrices(date: string, rawPrices: number[]): DayPrices {
  const avg = mean(rawPrices)
  const hours: HourPrice[] = rawPrices.map((priceKwh, hour) => ({
    hour,
    priceKwh,
    level: levelFor(priceKwh, avg),
    tramo: tramoForHour(hour, date),
  }))

  return {
    date,
    hours,
    avg,
    min: hours.reduce((a, b) => a.priceKwh <= b.priceKwh ? a : b),
    max: hours.reduce((a, b) => a.priceKwh >= b.priceKwh ? a : b),
  }
}

// La franja de `length` horas seguidas más barata que empieza en `from` o después.
// Devuelve null si ya no quedan tantas horas en el día.
export function cheapestWindow(hours: HourPrice[], from: number, length: number): PriceWindow | null {
  let best: PriceWindow | null = null
  for (let start = from; start + length <= hours.length; start++) {
    const avg = mean(hours.slice(start, start + length).map(h => h.priceKwh))
    if (!best || avg < best.avg) best = { start, length, avg }
  }
  return best
}
