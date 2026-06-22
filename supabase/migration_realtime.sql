-- ============================================================
-- 점주 실시간 신규주문 알림 — orders 테이블 Realtime 활성화
-- 사용법: Supabase 대시보드 → SQL Editor → New query 에 붙여넣고 Run
-- (이 SQL을 실행하지 않으면 점주 화면에 실시간 알림이 오지 않습니다)
-- ============================================================

-- orders 테이블 변경(INSERT/UPDATE)을 실시간으로 내보내도록 publication에 추가.
-- 이미 추가돼 있으면 "already member" 에러가 날 수 있는데, 그럴 땐 무시하면 됩니다.
do $$
begin
  alter publication supabase_realtime add table orders;
exception
  when duplicate_object then null;  -- 이미 추가됨 → 무시
end $$;

-- UPDATE 이벤트를 안정적으로 받기 위해 변경 전/후 전체 row를 내보내도록 설정.
alter table orders replica identity full;

-- 참고: orders 테이블에는 이미 "점주는 자기 매장 주문만 조회" RLS 정책이 있어,
-- 실시간 이벤트도 점주 본인 매장 주문만 전달됩니다. (추가 RLS 설정 불필요)
