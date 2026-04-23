import { useMemo, useState } from 'react'
import { findEmptyRooms } from '../lib/schedule'
import type { ClassSlot } from '../lib/schedule'
import { rankRooms } from '../lib/ranking'
import type { BuildingsMap, RoomsMeta } from '../lib/data'
import { useGeolocation } from '../lib/useGeolocation'
import { usePersistedState } from '../lib/usePersistedState'
import { toMinutes } from '../lib/time'
import { RoomCard } from './RoomCard'
import { Icon } from './Icon'

const WEEKDAYS = ['월', '화', '수', '목', '금']
const ALL_DAYS = ['일', '월', '화', '수', '목', '금', '토']

interface Props {
  schedule: ClassSlot[]
  buildings: BuildingsMap
  rooms: RoomsMeta
}

export function TimeSearchView({ schedule, buildings, rooms }: Props) {
  const todayChar = ALL_DAYS[new Date().getDay()]
  const defaultDay = WEEKDAYS.includes(todayChar) ? todayChar : '월'
  const [day, setDay] = useState(defaultDay)
  const [start, setStart] = useState('10:00')
  const [end, setEnd] = useState('11:00')
  const [submitted, setSubmitted] = useState(false)
  const [showLabs, setShowLabs] = usePersistedState<boolean>('pref:showLabs', false)
  const [manualBuilding, setManualBuilding] = usePersistedState<string>('pref:manualBuilding', '')

  const { state: geo, request: requestGeo } = useGeolocation()

  const userPos =
    manualBuilding && buildings[manualBuilding]
      ? { lat: buildings[manualBuilding].lat, lng: buildings[manualBuilding].lng }
      : geo.status === 'granted'
        ? { lat: geo.pos.lat, lng: geo.pos.lng }
        : null

  const { visible, excluded } = useMemo(() => {
    if (!submitted) return { visible: [], excluded: 0 }
    const startMin = toMinutes(start)
    const endMin = toMinutes(end)
    if (endMin <= startMin) return { visible: [], excluded: 0 }
    const empty = findEmptyRooms(schedule, day, startMin, endMin)
    const ranked = rankRooms(empty, buildings, rooms, userPos)
    if (showLabs) return { visible: ranked, excluded: 0 }
    const classrooms = ranked.filter(r => r.roomType === 'classroom')
    return { visible: classrooms, excluded: ranked.length - classrooms.length }
  }, [schedule, buildings, rooms, day, start, end, submitted, userPos, showLabs])

  const invalid = toMinutes(end) <= toMinutes(start)
  const buildingOptions = Object.entries(buildings).sort((a, b) =>
    a[1].name.localeCompare(b[1].name, 'ko')
  )

  return (
    <div className="space-y-6">
      <form
        onSubmit={e => {
          e.preventDefault()
          if (!invalid) setSubmitted(true)
        }}
        className="bg-surface-container-low border border-outline-variant/30 rounded-[32px] p-6 space-y-6 shadow-xl"
      >
        <div className="space-y-3">
          <p className="text-label-caps text-on-surface-variant opacity-70">요일 선택</p>
          <div className="flex justify-between items-center">
            {WEEKDAYS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={`w-12 h-12 flex items-center justify-center rounded-full font-bold transition-all ${
                  day === d
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant active:scale-95'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="space-y-3 block">
            <span className="text-label-caps text-on-surface-variant opacity-70">시작 시간</span>
            <div className="bg-surface-container-highest rounded-2xl h-14 flex items-center px-4 justify-between">
              <input
                type="time"
                value={start}
                onChange={e => setStart(e.target.value)}
                className="bg-transparent text-numeric text-body-lg text-on-surface w-full outline-none"
              />
              <Icon name="schedule" className="text-outline text-[20px]" />
            </div>
          </label>
          <label className="space-y-3 block">
            <span className="text-label-caps text-on-surface-variant opacity-70">종료 시간</span>
            <div className="bg-surface-container-highest rounded-2xl h-14 flex items-center px-4 justify-between">
              <input
                type="time"
                value={end}
                onChange={e => setEnd(e.target.value)}
                className="bg-transparent text-numeric text-body-lg text-on-surface w-full outline-none"
              />
              <Icon name="schedule" className="text-outline text-[20px]" />
            </div>
          </label>
        </div>

        {invalid && <p className="text-body-md text-error">종료는 시작보다 뒤여야 합니다.</p>}

        <div className="space-y-3">
          <p className="text-label-caps text-on-surface-variant opacity-70">내 위치 기준 건물</p>
          <div className="relative">
            <select
              value={manualBuilding}
              onChange={e => setManualBuilding(e.target.value)}
              className="w-full bg-surface-container-highest text-body-md text-on-surface rounded-2xl h-14 px-4 pr-12 appearance-none"
            >
              <option value="">— 선택 안 함 / GPS 사용 —</option>
              {buildingOptions.map(([key, b]) => (
                <option key={key} value={key}>
                  {b.name}
                </option>
              ))}
            </select>
            <Icon
              name={manualBuilding ? 'location_on' : 'expand_more'}
              filled={!!manualBuilding}
              className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                manualBuilding ? 'text-secondary' : 'text-outline'
              }`}
            />
          </div>
          {!manualBuilding && geo.status === 'idle' && (
            <button
              type="button"
              onClick={requestGeo}
              className="text-label-caps text-primary-container underline underline-offset-2"
            >
              또는 GPS 사용
            </button>
          )}
          {!manualBuilding && geo.status === 'granted' && (
            <div className="flex items-center gap-1.5">
              <Icon name="gps_fixed" className="text-[14px] text-secondary" />
              <span className="text-label-caps text-secondary">
                GPS · ±{Math.round(geo.pos.accuracyM)}m
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 pt-2">
          <label className="flex-1 flex items-center justify-between bg-surface-container-highest rounded-2xl h-14 px-4 cursor-pointer">
            <span className="text-body-md text-on-surface-variant">실습실 포함</span>
            <input
              type="checkbox"
              checked={showLabs}
              onChange={e => setShowLabs(e.target.checked)}
              className="w-5 h-5 accent-primary-container"
            />
          </label>
          <button
            type="submit"
            disabled={invalid}
            className="bg-primary-container text-on-primary-container font-bold h-14 px-8 rounded-2xl shadow-lg shadow-primary-container/20 active:scale-95 transition-all disabled:opacity-50"
          >
            검색
          </button>
        </div>
      </form>

      {submitted && (
        <section className="space-y-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 text-on-surface">검색 결과</h2>
            <p className="text-body-md text-on-surface-variant">
              {day}요일 {start}~{end} · {visible.length}개 방
              {excluded > 0 && ` · 실습실/공연장 ${excluded}개 제외됨`}
            </p>
          </div>
          {visible.length === 0 && (
            <div className="rounded-2xl bg-surface-container-low border border-outline-variant/20 p-8 text-center">
              <Icon name="search_off" className="text-4xl text-on-surface-variant" />
              <p className="mt-2 text-body-md text-on-surface-variant">
                이 시간대에 비어있는 강의실이 없어요.
              </p>
            </div>
          )}
          <div className="space-y-3">
            {visible.map(r => (
              <RoomCard key={r.room} room={r} referenceMin={toMinutes(end)} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
