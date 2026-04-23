import { useEffect, useMemo, useState } from 'react'
import { findEmptyRooms } from '../lib/schedule'
import type { ClassSlot } from '../lib/schedule'
import { rankRooms } from '../lib/ranking'
import type { BuildingsMap, RoomsMeta } from '../lib/data'
import { useGeolocation } from '../lib/useGeolocation'
import { usePersistedState } from '../lib/usePersistedState'
import { fromMinutes } from '../lib/time'
import { RoomCard } from './RoomCard'
import { Icon } from './Icon'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  schedule: ClassSlot[]
  buildings: BuildingsMap
  rooms: RoomsMeta
}

export function NowView({ schedule, buildings, rooms }: Props) {
  const [now, setNow] = useState(() => new Date())
  const [showLabs, setShowLabs] = usePersistedState<boolean>('pref:showLabs', false)
  const [manualBuilding, setManualBuilding] = usePersistedState<string>('pref:manualBuilding', '')
  const { state: geo, request: requestGeo } = useGeolocation()

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const day = WEEKDAYS[now.getDay()]
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const windowEnd = nowMin + 30

  const userPos =
    manualBuilding && buildings[manualBuilding]
      ? { lat: buildings[manualBuilding].lat, lng: buildings[manualBuilding].lng }
      : geo.status === 'granted'
        ? { lat: geo.pos.lat, lng: geo.pos.lng }
        : null

  const { visible, excluded } = useMemo(() => {
    const empty = findEmptyRooms(schedule, day, nowMin, windowEnd)
    const ranked = rankRooms(empty, buildings, rooms, userPos)
    if (showLabs) return { visible: ranked, excluded: 0 }
    const classrooms = ranked.filter(r => r.roomType === 'classroom')
    return { visible: classrooms, excluded: ranked.length - classrooms.length }
  }, [schedule, buildings, rooms, day, nowMin, windowEnd, userPos, showLabs])

  const isWeekend = day === '토' || day === '일'
  const buildingOptions = Object.entries(buildings).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, 'ko')
  )

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-surface-container border border-outline-variant/30 p-6 glass">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-[60px] rounded-full"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            <span className="text-label-caps text-on-surface-variant">
              지금 기준 — 앞으로 30분 비어있는 방
            </span>
          </div>
          <h1 className="text-[40px] font-bold text-on-surface tracking-tighter leading-none">
            {day}요일 {fromMinutes(nowMin)}
          </h1>
          {isWeekend && (
            <p className="text-body-md text-tertiary">
              주말은 시간표가 없어 모든 방이 빈 것으로 보입니다.
            </p>
          )}
          <div className="space-y-3 pt-1">
            <label className="block">
              <span className="text-label-caps text-on-surface-variant opacity-70">
                내 위치 (건물 직접 선택 권장)
              </span>
              <div className="mt-2 relative">
                <select
                  value={manualBuilding}
                  onChange={e => setManualBuilding(e.target.value)}
                  className="w-full bg-surface-container-high/60 text-body-lg text-on-surface rounded-2xl h-14 px-4 pr-10 border border-outline-variant/20 appearance-none"
                >
                  <option value="">— GPS 사용 또는 선택 안 함 —</option>
                  {buildingOptions.map(([key, b]) => (
                    <option key={key} value={key}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
              </div>
            </label>
            <div className="flex items-center gap-1.5 px-1">
              {manualBuilding ? (
                <>
                  <Icon name="location_on" filled className="text-[14px] text-secondary" />
                  <span className="text-label-caps text-secondary">
                    기준: {buildings[manualBuilding].name}
                  </span>
                </>
              ) : geo.status === 'idle' ? (
                <button
                  type="button"
                  onClick={requestGeo}
                  className="text-label-caps text-primary-container underline underline-offset-2"
                >
                  GPS 허용하기
                </button>
              ) : geo.status === 'loading' ? (
                <span className="text-label-caps text-on-surface-variant">위치 확인 중…</span>
              ) : geo.status === 'granted' ? (
                <>
                  <Icon name="gps_fixed" className="text-[14px] text-secondary" />
                  <span className="text-label-caps text-secondary">
                    GPS · ±{Math.round(geo.pos.accuracyM)}m
                    {geo.pos.accuracyM > 50 && ' (실내는 부정확 → 건물 선택 권장)'}
                  </span>
                </>
              ) : (
                <span className="text-label-caps text-error">
                  GPS 거부됨 — 건물 직접 선택하세요
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-body-lg font-bold text-on-surface">{visible.length}개 방</span>
          {excluded > 0 && (
            <span className="text-label-caps text-on-surface-variant mt-0.5">
              실습실/공연장 {excluded}개 제외됨
            </span>
          )}
        </div>
        <label className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-full border border-outline-variant/30 cursor-pointer">
          <span className="text-label-caps text-on-surface-variant">실습실 포함</span>
          <input
            type="checkbox"
            checked={showLabs}
            onChange={e => setShowLabs(e.target.checked)}
            className="accent-primary-container"
          />
        </label>
      </section>

      {visible.length === 0 && (
        <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-8 text-center">
          <Icon name="search_off" className="text-4xl text-on-surface-variant" />
          <p className="mt-2 text-body-md text-on-surface-variant">
            지금 비어있는 강의실이 없어요.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {visible.map(r => (
          <RoomCard key={r.room} room={r} referenceMin={nowMin} />
        ))}
      </div>
    </div>
  )
}
