-- ============================================================
-- 상품별 노출 매장 지정 기능
-- 사용법: Supabase 대시보드 → SQL Editor → New query 에 붙여넣고 Run
-- ============================================================
-- 상품을 어느 매장에 올릴지 다중 선택. 비어있으면(기본) 전체 매장에 노출.
alter table products
  add column if not exists store_ids uuid[] default '{}';
