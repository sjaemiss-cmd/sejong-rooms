import { describe, it, expect } from 'vitest'
import { haversine } from '../lib/distance'

describe('haversine', () => {
  it('같은 좌표는 0', () => {
    expect(haversine(37.5506, 127.0744, 37.5506, 127.0744)).toBeCloseTo(0, 1)
  })

  it('서울시청 → 강남역 약 8.6km', () => {
    // 서울시청 37.5665, 126.9780 / 강남역 37.4979, 127.0276
    const d = haversine(37.5665, 126.9780, 37.4979, 127.0276)
    expect(d).toBeGreaterThan(8000)
    expect(d).toBeLessThan(9500)
  })

  it('세종대 캠퍼스 내 20m 이동', () => {
    // 위도 1e-4 ≈ 11m
    const d = haversine(37.5506, 127.0744, 37.5508, 127.0744)
    expect(d).toBeGreaterThan(15)
    expect(d).toBeLessThan(30)
  })
})
