-- ============================================================
-- 사용자(카카오 계정) 삭제 가능하게: auth.users 참조 FK를 ON DELETE SET NULL 로 변경
-- 사용법: Supabase → SQL Editor → New query 에 붙여넣고 Run
-- 효과: 계정 삭제 시 주문/매장 "기록은 보존"하고 계정 연결만 해제(user_id 등 NULL)
-- ============================================================

-- 1) 주문 - 주문자 계정
alter table orders drop constraint if exists orders_user_id_fkey;
alter table orders add constraint orders_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

-- 2) 주문 - 처리한 점주 계정
alter table orders drop constraint if exists orders_handled_by_fkey;
alter table orders add constraint orders_handled_by_fkey
  foreign key (handled_by) references auth.users(id) on delete set null;

-- 3) 매장 - 점주 로그인 계정
alter table stores drop constraint if exists stores_auth_user_id_fkey;
alter table stores add constraint stores_auth_user_id_fkey
  foreign key (auth_user_id) references auth.users(id) on delete set null;
