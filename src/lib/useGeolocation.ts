import { useState } from 'react'
import type { UserPos } from './ranking'

export interface GeoPos extends UserPos {
  accuracyM: number
}

export type GeoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'granted'; pos: GeoPos }
  | { status: 'denied'; reason: string }

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: 'idle' })

  const request = () => {
    if (!navigator.geolocation) {
      setState({ status: 'denied', reason: '이 브라우저는 위치 기능을 지원하지 않습니다' })
      return
    }
    setState({ status: 'loading' })
    navigator.geolocation.getCurrentPosition(
      p =>
        setState({
          status: 'granted',
          pos: {
            lat: p.coords.latitude,
            lng: p.coords.longitude,
            accuracyM: p.coords.accuracy,
          },
        }),
      err => setState({ status: 'denied', reason: err.message }),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 }
    )
  }

  return { state, request }
}
