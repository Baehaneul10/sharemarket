-- ============================================================
-- 매장별 URL 주소(slug) 추가
-- 사용법: Supabase 대시보드 → SQL Editor → New query 에 붙여넣고 Run
-- 예) slug='pangyo' 인 매장은 /s/pangyo 로 접속
-- ============================================================

alter table stores add column if not exists slug text;
create unique index if not exists stores_slug_key on stores(slug);

-- 기존 매장 slug 지정 (필요 시 값 수정)
update stores set slug = 'pangyo' where id = '4a3c5b3d-778e-43d7-983d-0b747fc1e247';  -- 영영상점 판교점
update stores set slug = 'test'   where id = '04a8baa4-821a-4812-9d8d-7c7956152d37';  -- 영영상점 테스트점
