"""xlsx 강의시간표를 schedule.json + rooms.json 으로 변환.

- schedule.json: 한 수업의 한 시간 블록 = JSON 1레코드
- rooms.json: 방별 분류 (classroom / lab / performance)
"""
from __future__ import annotations

import json
import re
import sys
import io
from collections import Counter, defaultdict
from pathlib import Path

import openpyxl

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
XLSX = ROOT / "2026-1학기 강의시간표(한국어)_20260212.xlsx"
OVERRIDES = ROOT / "scripts" / "lab-overrides.json"
OUT_SCHEDULE = ROOT / "public" / "data" / "schedule.json"
OUT_ROOMS = ROOT / "public" / "data" / "rooms.json"

WEEKDAYS = {"월", "화", "수", "목", "금", "토", "일"}
TIME_RE = re.compile(r"(\d{1,2}):(\d{2})")
ROOM_BUILDING_RE = re.compile(r"^(센B|[가-힣])")

# 과목명 키워드 — 매우 강한 실습실 신호
LAB_KEYWORDS = ["실험", "실기", "실습", "연주", "스튜디오"]
PERFORMANCE_TOKENS = ["공연장", "강당"]


def parse_time_segment(seg: str) -> list[tuple[str, str, str]]:
    seg = seg.strip()
    if not seg:
        return []
    times = TIME_RE.findall(seg)
    if len(times) < 2:
        return []
    start = f"{int(times[0][0]):02d}:{times[0][1]}"
    end = f"{int(times[1][0]):02d}:{times[1][1]}"
    days = [ch for ch in seg if ch in WEEKDAYS]
    if not days:
        return []
    return [(d, start, end) for d in days]


def extract_building(room: str) -> str:
    room = room.strip()
    if not room:
        return ""
    base = re.split(r"\s*\(", room, maxsplit=1)[0]
    if re.search(r"\d", base):
        m = ROOM_BUILDING_RE.match(base)
        return m.group(1) if m else base
    return base


def classify_room(
    room: str,
    types: Counter,
    courses: set[str],
    force_labs: set[str],
    force_classrooms: set[str],
) -> tuple[str, str | None]:
    """(roomType, reason) 반환. roomType ∈ classroom | lab | performance."""
    if room in force_classrooms:
        return "classroom", "수동: 강의실로 지정"
    if room in force_labs:
        return "lab", "수동: 실습실로 지정"
    if any(tok in room for tok in PERFORMANCE_TOKENS):
        return "performance", "공연장/강당"

    theory = types.get("이론", 0)
    total = sum(types.values())
    if total == 0:
        return "classroom", None

    # 이론 수업이 하나도 없으면 실습실
    if theory == 0:
        return "lab", "100% 실험/실습/실기 유형"

    # 과목명에 실습 키워드 하나라도 포함되면 실습실
    for c in courses:
        for kw in LAB_KEYWORDS:
            if kw in c:
                return "lab", f'"{kw}" 수업 편성됨'

    return "classroom", None


def main() -> None:
    override_data = json.loads(OVERRIDES.read_text(encoding="utf-8")) if OVERRIDES.exists() else {}
    force_labs = set(override_data.get("forceLabs", []))
    force_classrooms = set(override_data.get("forceClassrooms", []))

    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb.active

    records: list[dict] = []
    by_room_type: dict[str, Counter] = defaultdict(Counter)
    by_room_courses: dict[str, set] = defaultdict(set)
    skipped_no_time = 0
    skipped_no_room = 0
    skipped_unparseable = 0
    mismatched = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        course_id = row[3]
        section = row[4]
        course_name = row[5] or ""
        class_type = row[11] or "(미지정)"
        time_str = row[13]
        room_str = row[14]

        if not time_str:
            skipped_no_time += 1
            continue
        if not room_str:
            skipped_no_room += 1
            continue

        time_parts = [t.strip() for t in str(time_str).split(",") if t.strip()]
        room_parts = [r.strip() for r in str(room_str).split(",") if r.strip()]

        if len(time_parts) == len(room_parts):
            pairs = list(zip(time_parts, room_parts))
        else:
            mismatched += 1
            pairs = [(t, r) for t in time_parts for r in room_parts]

        for t_seg, room in pairs:
            slots = parse_time_segment(t_seg)
            if not slots:
                skipped_unparseable += 1
                continue
            by_room_type[room][class_type] += len(slots)
            by_room_courses[room].add(course_name)
            for day, start, end in slots:
                records.append({
                    "room": room,
                    "building": extract_building(room),
                    "day": day,
                    "start": start,
                    "end": end,
                    "course": course_name,
                    "courseId": f"{course_id}-{section}",
                })

    # 방 분류
    rooms_meta: dict[str, dict] = {}
    type_counts = Counter()
    for room, types in by_room_type.items():
        kind, reason = classify_room(
            room, types, by_room_courses[room], force_labs, force_classrooms
        )
        rooms_meta[room] = {
            "building": extract_building(room),
            "type": kind,
            **({"reason": reason} if reason else {}),
        }
        type_counts[kind] += 1

    OUT_SCHEDULE.parent.mkdir(parents=True, exist_ok=True)
    OUT_SCHEDULE.write_text(json.dumps(records, ensure_ascii=False, indent=0), encoding="utf-8")
    OUT_ROOMS.write_text(json.dumps(rooms_meta, ensure_ascii=False, indent=0), encoding="utf-8")

    print(f"총 레코드: {len(records)}")
    print(f"고유 강의실: {len(rooms_meta)}")
    print(f"  - classroom: {type_counts['classroom']}")
    print(f"  - lab: {type_counts['lab']}")
    print(f"  - performance: {type_counts['performance']}")
    print(f"스킵 (시간 없음): {skipped_no_time}")
    print(f"스킵 (강의실 없음): {skipped_no_room}")
    print(f"스킵 (파싱 실패): {skipped_unparseable}")
    print(f"시간/방 개수 불일치: {mismatched}")
    print(f"수동 오버라이드 — labs: {len(force_labs)}, classrooms: {len(force_classrooms)}")
    print(f"출력: {OUT_SCHEDULE}, {OUT_ROOMS}")


if __name__ == "__main__":
    main()
