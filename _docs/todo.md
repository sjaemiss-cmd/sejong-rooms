# TODO

## 완료

- [x] 1~14. 기본 스캐폴딩 / 데이터 / 로직 / UI / 실습실 필터링
- [x] 15. OSM 실좌표로 buildings.json 교체 (충무관 266m 오차 수정)
- [x] 16. 실내 GPS 대응 — 건물 직접 선택 드롭다운 + GPS 정확도 표시
- [x] 17. Stitch 목업 기반 UI 리디자인 (M3 다크, Pretendard, Material Symbols, pill tabs)
- [x] 18. **탭 간 상태 지속** — `usePersistedState` 훅, localStorage 기반
  - `pref:manualBuilding`, `pref:showLabs` 두 키만 공유
- [x] 19. **PWA 설치** 지원
  - `public/manifest.webmanifest` (세종대 빈 강의실, standalone)
  - `public/sw.js` (installability 확보용 최소 SW)
  - PWA 아이콘 5종 Pillow로 자동 생성 (192/512/180/maskable/favicon)
  - `InstallButton` 컴포넌트 — Android는 beforeinstallprompt, iOS는 Safari 공유 안내 모달

## 남은 작업

- [ ] 20. **Cloudflare Pages 배포**
  - wrangler 설치 중 (백그라운드)
  - 배포는 사용자 인증 필요 → 안내 메시지로 처리

## 운영 노트

### 학기 데이터 교체
```bash
# 새 xlsx를 루트에 놓고 파일명 수정 후
npm run data:build
```

### 실습실 추가 등록
`scripts/lab-overrides.json` → `forceLabs` 배열에 방 이름 추가 → `npm run data:build` 재실행.

### 건물 좌표 수정
`public/data/buildings.json` 직접 수정. approximate 표시된 4개 건물 (새날관, 센트럴타워 A/B, 호텔관)은 직접 확인 필요.

### PWA 아이콘 재생성
`python scripts/gen-icons.py` (Pillow + Malgun Gothic 필요, Windows 전용)

### 배포
```bash
npx wrangler login          # 최초 1회, 브라우저 OAuth
npm run deploy              # dist 빌드 + 업로드
```
