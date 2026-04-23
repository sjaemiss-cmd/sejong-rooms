-- 세종대 빈 강의실 — Supabase 스키마
-- Supabase Dashboard → SQL Editor에 전체 붙여넣고 Run.

-- ============================================================
-- 1. photos — 사용자 업로드 사진
-- ============================================================
create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  room_code     text not null,
  storage_path  text not null,
  anon_id       text not null,
  created_at    timestamptz not null default now(),
  hidden        boolean not null default false,
  report_count  int not null default 0
);
create index if not exists photos_room_visible_idx
  on public.photos(room_code, created_at desc)
  where not hidden;

alter table public.photos enable row level security;

drop policy if exists "photos: read visible" on public.photos;
create policy "photos: read visible"
  on public.photos for select
  using (not hidden);

drop policy if exists "photos: anon insert" on public.photos;
create policy "photos: anon insert"
  on public.photos for insert
  with check (true);

-- ============================================================
-- 2. reports — 제보 (강의실 문제 / 사진 신고 공용)
-- ============================================================
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  room_code   text not null,
  photo_id    uuid references public.photos(id) on delete set null,
  reason      text not null check (char_length(reason) between 1 and 500),
  anon_id     text not null,
  created_at  timestamptz not null default now(),
  resolved    boolean not null default false
);

alter table public.reports enable row level security;

drop policy if exists "reports: anon insert" on public.reports;
create policy "reports: anon insert"
  on public.reports for insert
  with check (true);

-- ============================================================
-- 3. reactions — 👍 좋은 강의실 / 🚫 사용 불가
-- 한 익명 사용자 × 한 방 = 하나의 반응만
-- ============================================================
create table if not exists public.reactions (
  room_code   text not null,
  anon_id     text not null,
  kind        text not null check (kind in ('good','broken')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (room_code, anon_id)
);

alter table public.reactions enable row level security;

drop policy if exists "reactions: read all" on public.reactions;
create policy "reactions: read all"
  on public.reactions for select using (true);

drop policy if exists "reactions: anon insert" on public.reactions;
create policy "reactions: anon insert"
  on public.reactions for insert with check (true);

drop policy if exists "reactions: anon update" on public.reactions;
create policy "reactions: anon update"
  on public.reactions for update using (true) with check (true);

drop policy if exists "reactions: anon delete" on public.reactions;
create policy "reactions: anon delete"
  on public.reactions for delete using (true);

-- ============================================================
-- 4. reaction_counts — 방별 집계 뷰
-- ============================================================
create or replace view public.reaction_counts as
select
  room_code,
  count(*) filter (where kind = 'good')   as good_count,
  count(*) filter (where kind = 'broken') as broken_count
from public.reactions
group by room_code;

-- ============================================================
-- 5. 신고 3회 시 사진 자동 숨김 트리거
-- ============================================================
create or replace function public.hide_after_reports()
returns trigger
language plpgsql
as $$
begin
  if new.photo_id is not null then
    update public.photos
       set report_count = report_count + 1,
           hidden = (report_count + 1 >= 3) or hidden
     where id = new.photo_id;
  end if;
  return new;
end;
$$;

drop trigger if exists after_report_insert on public.reports;
create trigger after_report_insert
  after insert on public.reports
  for each row execute function public.hide_after_reports();

-- ============================================================
-- 6. Storage bucket — room-photos (공개 read)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('room-photos', 'room-photos', true, 2097152, array['image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "photos bucket: public read" on storage.objects;
create policy "photos bucket: public read"
  on storage.objects for select
  using (bucket_id = 'room-photos');

drop policy if exists "photos bucket: anon upload" on storage.objects;
create policy "photos bucket: anon upload"
  on storage.objects for insert
  with check (bucket_id = 'room-photos');
