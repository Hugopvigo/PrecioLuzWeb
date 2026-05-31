export type PriceTier = 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
export type Tramo = 'VALLE' | 'LLANO' | 'PUNTA'

export interface HourPrice {
  hour: number
  priceKwh: number
  tier: PriceTier
  tramo: Tramo
  isMin: boolean
  isMax: boolean
}

export interface DayPrices {
  date: string
  hours: HourPrice[]
  avg: number
  min: HourPrice
  max: HourPrice
  bestWindow: [number, number]
  worstWindow: [number, number]
}

export interface ApiResponse {
  updated_at: string
  today: { date: string; prices: number[] }
  tomorrow: { date: string; prices: number[] } | null
}
