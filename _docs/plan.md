# 빈 강의실 찾기 앱 — 구현 계획

## 목표
세종대 2026-1학기 강의시간표 기준, 현재 위치/지정 시간대에 빈 강의실을 찾는 정적 웹앱.

## 기능 (MVP)
1. **지금 모드** — 현재 요일/시각 + GPS → 가까운 순 빈 강의실 리스트
2. **시간 지정 모드** — 요일 + 시작/종료 시간 → 빈 강의실 리스트 (위치 있으면 거리순)

## 기술 스택
- Vite + React + TypeScript + Tailwind v4
- Vitest (TDD)
- 빌드 스크립트: Python (openpyxl) — xlsx → JSON
- 배포: Cloudflare Pages (HTTPS 필수, GPS 사용 위해)

## 데이터 스키마
```json
// public/data/schedule.json
{ "room": "광207", "building": "광", "day": "월",
  "start": "09:00", "end": "10:30",
  "course": "경영학원론", "section": "001" }

// public/data/buildings.json
{ "광": { "name": "광개토관", "lat": 37.5507, "lng": 127.0735 } }
```

## 판정 로직
- 시간 겹침: `start1 < end2 && start2 < end1`
- 빈 방 = (schedule 전체 방 set) - (해당 시간 점유 방 set)
- 다음 수업까지 남은 시간도 함께 표시

## 태스크 14개 (2~5분 단위, TDD)
1. Vite+React+TS+Tailwind+Vitest 초기화
2. build-data.py — xlsx 파싱 + 페어링 + 요일 확장
3. buildings.json 좌표 작성
4. [RED] lib/time.ts 테스트
5. [GREEN] lib/time.ts 구현
6. [RED] lib/schedule.ts 테스트
7. [GREEN] lib/schedule.ts 구현
8. lib/distance.ts (haversine)
9. App.tsx 탭 골격
10. NowView 컴포넌트
11. TimeSearchView 컴포넌트
12. RoomCard 컴포넌트
13. 로컬 빌드/LAN 테스트
14. Cloudflare Pages 배포

## 과설계 방지 (하지 않는 것)
- 즐겨찾기/히스토리
- 지도 뷰
- PWA 오프라인
- 건물 필터 (거리 정렬로 대체)
- 광고/애널리틱스
