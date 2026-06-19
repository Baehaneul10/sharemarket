-- ============================================================
-- 상품 이미지 저장소(버킷) 생성
-- 사용법: Supabase → SQL Editor → New query 에 붙여넣고 Run
-- (또는 Storage → New bucket → 이름 'products' → Public bucket 켜기 로도 가능)
-- ============================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- public 버킷이라 이미지는 누구나 볼 수 있고(공개 URL),
-- 업로드는 본사 관리자 서버(service_role)에서만 이루어집니다.
