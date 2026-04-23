import { describe, it, expect } from 'vitest'
import { toMinutes, fromMinutes, overlaps } from '../lib/time'

describe('toMinutes', () => {
  it('자정은 0', () => {
    expect(toMinutes('00:00')).toBe(0)
  })
  it('09:30은 570', () => {
    expect(toMinutes('09:30')).toBe(570)
  })
  it('23:59는 1439', () => {
    expect(toMinutes('23:59')).toBe(1439)
  })
})

describe('fromMinutes', () => {
  it('570은 09:30', () => {
    expect(fromMinutes(570)).toBe('09:30')
  })
  it('0은 00:00', () => {
    expect(fromMinutes(0)).toBe('00:00')
  })
})

describe('overlaps', () => {
  it('완전 겹침', () => {
    expect(overlaps(540, 630, 540, 630)).toBe(true)
  })
  it('부분 겹침', () => {
    expect(overlaps(540, 630, 600, 660)).toBe(true)
  })
  it('맞닿은 경계는 비겹침', () => {
    expect(overlaps(540, 600, 600, 660)).toBe(false)
  })
  it('완전 분리', () => {
    expect(overlaps(540, 600, 660, 720)).toBe(false)
  })
  it('하나가 다른 하나를 포함', () => {
    expect(overlaps(540, 720, 600, 660)).toBe(true)
  })
})
