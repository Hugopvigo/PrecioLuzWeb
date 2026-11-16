import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDayPrices, cheapestWindow, formatPrice, hh, levelFor, tramoForHour } from './utils.ts'

const flat = (n: number, price = 0.1) => Array.from({ length: n }, () => price)

test('levelFor: por debajo del 85 % de la media es LOW', () => {
  assert.equal(levelFor(0.84, 1), 'LOW')
  assert.equal(levelFor(0, 1), 'LOW')
})

test('levelFor: por encima del 115 % de la media es HIGH', () => {
  assert.equal(levelFor(1.16, 1), 'HIGH')
  assert.equal(levelFor(5, 1), 'HIGH')
})

test('levelFor: en medio y en los límites exactos es MID', () => {
  assert.equal(levelFor(1, 1), 'MID')
  assert.equal(levelFor(0.85, 1), 'MID')
  assert.equal(levelFor(1.15, 1), 'MID')
})

test('tramoForHour: laborable (lunes)', () => {
  const d = '2026-11-16'
  const expected = (h: number) =>
    h <= 7 ? 'VALLE'
    : h <= 9 ? 'LLANO'
    : h <= 13 ? 'PUNTA'
    : h <= 17 ? 'LLANO'
    : h <= 21 ? 'PUNTA'
    : 'LLANO'
  for (let h = 0; h < 24; h++) assert.equal(tramoForHour(h, d), expected(h), `hora ${h}`)
  // límites explícitos
  assert.equal(tramoForHour(7, d), 'VALLE')
  assert.equal(tramoForHour(8, d), 'LLANO')
  assert.equal(tramoForHour(10, d), 'PUNTA')
  assert.equal(tramoForHour(14, d), 'LLANO')
  assert.equal(tramoForHour(18, d), 'PUNTA')
  assert.equal(tramoForHour(22, d), 'LLANO')
})

test('tramoForHour: sábado y domingo todo VALLE', () => {
  for (const d of ['2026-11-21', '2026-11-22']) {
    for (let h = 0; h < 24; h++) assert.equal(tramoForHour(h, d), 'VALLE', `${d} hora ${h}`)
  }
})

test('buildDayPrices: media, min y max', () => {
  const prices = flat(24, 0.2)
  prices[3] = 0.05
  prices[15] = 0.5
  const day = buildDayPrices('2026-11-16', prices)
  assert.equal(day.date, '2026-11-16')
  assert.equal(day.hours.length, 24)
  assert.ok(Math.abs(day.avg - prices.reduce((s, v) => s + v, 0) / 24) < 1e-12)
  assert.equal(day.min.hour, 3)
  assert.equal(day.min.priceKwh, 0.05)
  assert.equal(day.max.hour, 15)
  assert.equal(day.max.priceKwh, 0.5)
  assert.equal(day.hours[5].hour, 5)
  assert.equal(day.hours[5].tramo, 'VALLE')
  assert.equal(day.hours[11].tramo, 'PUNTA')
})

test('buildDayPrices: con empate gana la primera hora', () => {
  const prices = flat(24, 0.2)
  prices[4] = 0.05
  prices[9] = 0.05
  prices[6] = 0.5
  prices[20] = 0.5
  const day = buildDayPrices('2026-11-16', prices)
  assert.equal(day.min.hour, 4)
  assert.equal(day.max.hour, 6)
})

test('buildDayPrices: niveles respecto a la media', () => {
  const prices = flat(24, 1)
  prices[0] = 0.1
  prices[1] = 1.9
  const day = buildDayPrices('2026-11-16', prices)
  assert.equal(day.hours[0].level, 'LOW')
  assert.equal(day.hours[1].level, 'HIGH')
  assert.equal(day.hours[2].level, 'MID')
  for (const h of day.hours) assert.equal(h.level, levelFor(h.priceKwh, day.avg))
})

test('buildDayPrices: día plano es todo MID', () => {
  const day = buildDayPrices('2026-11-16', flat(24, 0.1234))
  assert.ok(day.hours.every(h => h.level === 'MID'))
  assert.equal(day.min.hour, 0)
  assert.equal(day.max.hour, 0)
})

test('buildDayPrices: 23 y 25 precios (cambio de hora) usan la longitud real', () => {
  for (const n of [23, 25]) {
    const prices = flat(n, 0.1)
    prices[n - 1] = 0.3
    const day = buildDayPrices('2026-11-16', prices)
    assert.equal(day.hours.length, n)
    assert.ok(Math.abs(day.avg - (0.1 * (n - 1) + 0.3) / n) < 1e-12, `media con ${n}`)
    assert.equal(day.max.hour, n - 1)
    assert.equal(day.min.hour, 0)
  }
})

test('cheapestWindow: franjas de 1, 2 y 3 horas', () => {
  const day = buildDayPrices('2026-11-16', [
    0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30,
    0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30, 0.30,
    0.30, 0.30, 0.30, 0.30, 0.10, 0.12, 0.05, 0.30,
  ])
  const w1 = cheapestWindow(day.hours, 0, 1)
  assert.equal(w1?.start, 22)
  assert.equal(w1?.length, 1)
  assert.ok(Math.abs(w1!.avg - 0.05) < 1e-12)

  const w2 = cheapestWindow(day.hours, 0, 2)
  assert.equal(w2?.start, 21)
  assert.equal(w2?.length, 2)
  assert.ok(Math.abs(w2!.avg - 0.085) < 1e-12)

  const w3 = cheapestWindow(day.hours, 0, 3)
  assert.equal(w3?.start, 20)
  assert.equal(w3?.length, 3)
  assert.ok(Math.abs(w3!.avg - 0.27 / 3) < 1e-12)
})

test('cheapestWindow: respeta from', () => {
  const prices = flat(24, 0.3)
  prices[2] = 0.01
  prices[3] = 0.01
  prices[18] = 0.1
  prices[19] = 0.1
  const { hours } = buildDayPrices('2026-11-16', prices)
  assert.equal(cheapestWindow(hours, 0, 2)?.start, 2)
  assert.equal(cheapestWindow(hours, 4, 2)?.start, 18)
  assert.equal(cheapestWindow(hours, 3, 2)?.start, 18)
})

test('cheapestWindow: null si no quedan length horas desde from', () => {
  const { hours } = buildDayPrices('2026-11-16', flat(24))
  assert.equal(cheapestWindow(hours, 23, 2), null)
  assert.equal(cheapestWindow(hours, 22, 3), null)
  assert.equal(cheapestWindow(hours, 24, 1), null)
  assert.notEqual(cheapestWindow(hours, 23, 1), null)
  assert.notEqual(cheapestWindow(hours, 21, 3), null)
})

test('cheapestWindow: con empate gana la más temprana', () => {
  const prices = flat(24, 0.3)
  prices[5] = 0.1
  prices[6] = 0.1
  prices[15] = 0.1
  prices[16] = 0.1
  const { hours } = buildDayPrices('2026-11-16', prices)
  assert.equal(cheapestWindow(hours, 0, 2)?.start, 5)
  assert.equal(cheapestWindow(hours, 0, 1)?.start, 5)
  assert.equal(cheapestWindow(hours, 6, 1)?.start, 6)
  assert.equal(cheapestWindow(hours, 7, 2)?.start, 15)
})

test('hh: hora con dos dígitos y 24 vuelve a 00', () => {
  assert.equal(hh(7), '07')
  assert.equal(hh(0), '00')
  assert.equal(hh(23), '23')
  assert.equal(hh(24), '00')
})

test('formatPrice: coma decimal y decimales configurables', () => {
  assert.equal(formatPrice(0.0879), '0,0879')
  assert.equal(formatPrice(0.2049, 3), '0,205')
  assert.equal(formatPrice(1), '1,0000')
})
