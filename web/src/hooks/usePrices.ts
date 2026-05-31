import { useQuery } from '@tanstack/react-query'
import { ApiResponse, DayPrices } from '../types'
import { buildDayPrices } from '../utils'

interface PricesResult {
  today:     DayPrices | null
  tomorrow:  DayPrices | null
  updatedAt: string | null
  isLoading: boolean
  error:     string | null
}

export function usePrices(): PricesResult {
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ['precios'],
    queryFn: async () => {
      const res = await fetch('/api/precios')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.json()
    },
    staleTime: 30 * 60 * 1000,
    retry: 2,
  })

  return {
    today:     data ? buildDayPrices(data.today.date, data.today.prices) : null,
    tomorrow:  data?.tomorrow ? buildDayPrices(data.tomorrow.date, data.tomorrow.prices) : null,
    updatedAt: data?.updated_at ?? null,
    isLoading,
    error:     error ? (error as Error).message : null,
  }
}
