export type PriceLevel = 'LOW' | 'MID' | 'HIGH'
export type Tramo = 'VALLE' | 'LLANO' | 'PUNTA'

export interface HourPrice {
  hour: number
  priceKwh: number
  level: PriceLevel
  tramo: Tramo
}

export interface DayPrices {
  date: string
  hours: HourPrice[]
  avg: number
  min: HourPrice
  max: HourPrice
}

export interface PriceWindow {
  start: number
  length: number
  avg: number
}

export interface ApiResponse {
  updated_at: string
  today: { date: string; prices: number[] }
  tomorrow: { date: string; prices: number[] } | null
}
