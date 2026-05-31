import type { DayPrices, HourPrice, PriceTier, Tramo } from './types'

export const TIER_COLORS_DARK: Record<PriceTier, string> = {
  GREEN:  '#30D158',
  YELLOW: '#FFE433',
  ORANGE: '#FF7020',
  RED:    '#FF3B30',
}

export const TIER_COLORS_LIGHT: Record<PriceTier, string> = {
  GREEN:  '#15A34A',
  YELLOW: '#B89500',
  ORANGE: '#D95200',
  RED:    '#CC1624',
}

export const TIER_LABELS: Record<PriceTier, string> = {
  GREEN:  'Barato',
  YELLOW: 'Moderado',
  ORANGE: 'Caro',
  RED:    'Muy caro',
}

export const TRAMO_LABELS: Record<Tramo, string> = {
  VALLE: 'Valle',
  LLANO: 'Llano',
  PUNTA: 'Punta',
}

function tramoForHour(hour: number, dateStr: string): Tramo {
  const dow = new Date(dateStr + 'T12:00:00').getDay()
  if (dow === 0 || dow === 6) return 'VALLE'
  if ((hour >= 10 && hour <= 13) || (hour >= 18 && hour <= 21)) return 'PUNTA'
  if (hour < 8) return 'VALLE'
  return 'LLANO'
}

export function buildDayPrices(date: string, rawPrices: number[]): DayPrices {
  const indexed = rawPrices.map((p, h) => ({ h, p }))
  const sorted  = [...indexed].sort((a, b) => a.p - b.p)
  const tiers: PriceTier[] = ['GREEN','GREEN','GREEN','GREEN','GREEN','GREEN',
                               'YELLOW','YELLOW','YELLOW','YELLOW','YELLOW','YELLOW',
                               'ORANGE','ORANGE','ORANGE','ORANGE','ORANGE','ORANGE',
                               'RED','RED','RED','RED','RED','RED']
  const tierMap = new Map<number, PriceTier>()
  sorted.forEach(({ h }, rank) => tierMap.set(h, tiers[rank]))

  const hours: HourPrice[] = rawPrices.map((priceKwh, hour) => ({
    hour,
    priceKwh,
    tier:  tierMap.get(hour)!,
    tramo: tramoForHour(hour, date),
    isMin: false,
    isMax: false,
  }))

  const minH = hours.reduce((a, b) => a.priceKwh < b.priceKwh ? a : b)
  const maxH = hours.reduce((a, b) => a.priceKwh > b.priceKwh ? a : b)
  hours[minH.hour] = { ...hours[minH.hour], isMin: true }
  hours[maxH.hour] = { ...hours[maxH.hour], isMax: true }

  const sum = (i: number) => hours[i].priceKwh + hours[i + 1].priceKwh
  const bestStart  = Array.from({ length: 23 }, (_, i) => i).reduce((best, i)  => sum(i) < sum(best) ? i : best, 0)
  const worstStart = Array.from({ length: 23 }, (_, i) => i).reduce((worst, i) => sum(i) > sum(worst) ? i : worst, 0)

  return {
    date,
    hours,
    avg: rawPrices.reduce((s, p) => s + p, 0) / 24,
    min: hours[minH.hour],
    max: hours[maxH.hour],
    bestWindow:  [bestStart, bestStart + 1],
    worstWindow: [worstStart, worstStart + 1],
  }
}
