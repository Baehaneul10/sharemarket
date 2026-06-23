-- ============================================================
-- 카카오 로그인 연동 마이그레이션
-- 사용법: Supabase → SQL Editor → New query 에 전체 붙여넣고 Run
-- ============================================================

-- 1) 주문 테이블: 계정 연결(user_id) + 이메일 컬럼 추가, 전화번호는 선택값으로 변경
alter table orders add column if not exists user_id uuid references auth.users on delete set null;
alter table orders add column if not exists email text;
alter table orders alter column phone drop not null;
create index if not exists orders_user_idx on orders(user_id);

-- 2) 고객이 자기 주문을 조회할 수 있는 정책 (계정 기준)
drop policy if exists "customer read own orders" on orders;
create policy "customer read own orders" on orders for select
  using (user_id = auth.uid());

-- 3) 주문 생성 함수 교체: 입력값 없이 로그인 계정 기준으로 생성
--    (전화/요청사항/동의 입력 제거, 이름·이메일은 카카오 계정에서 받음)
drop function if exists create_order(uuid, uuid, text, text, int, text, boolean);

create or replace function create_order(
  p_group_buy_id uuid,
  p_store_id     uuid,
  p_quantity     int,
  p_customer_name text,
  p_email        text
) returns orders language plpgsql security definer as $$
declare
  v_gb        group_buys%rowtype;
  v_product   products%rowtype;
  v_remaining int;
  v_order_no  text;
  v_order     orders%rowtype;
  v_today     text;
  v_uid       uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;

  select * into v_gb from group_buys where id = p_group_buy_id for update;
  if not found then raise exception '존재하지 않는 공구입니다'; end if;
  if v_gb.sale_end < now() then raise exception '주문이 마감되었습니다'; end if;

  select * into v_product from products where id = v_gb.product_id;

  if v_gb.total_qty is not null then
    v_remaining := v_gb.total_qty - coalesce(v_gb.ordered_qty, 0);
    if p_quantity > v_remaining then raise exception '남은 수량이 부족합니다'; end if;
  end if;
  if p_quantity < 1 then raise exception '수량은 1개 이상이어야 합니다'; end if;
  if p_quantity > coalesce(v_product.max_per_person, 999) then
    raise exception '1인 최대 주문 수량을 초과했습니다';
  end if;

  v_today := to_char((now() at time zone 'Asia/Seoul'), 'YYYYMMDD');
  v_order_no := next_order_no(v_today);

  insert into orders (
    order_no, group_buy_id, product_id, product_name, store_id,
    customer_name, phone, email, user_id, quantity, unit_price, total_price,
    privacy_agreed, status, pickup_date
  ) values (
    v_order_no, v_gb.id, v_product.id, v_product.name, p_store_id,
    p_customer_name, null, p_email, v_uid, p_quantity, v_product.group_price, v_product.group_price * p_quantity,
    true, 'received', v_gb.pickup_date
  ) returning * into v_order;

  update group_buys set ordered_qty = coalesce(ordered_qty, 0) + p_quantity where id = v_gb.id;
  return v_order;
end; $$;

-- ============================================================
-- 마이페이지: 고객이 본인 주문 수량 변경 / 취소 (로그인 계정 기준)
-- ============================================================
create or replace function update_my_order_qty(p_order_id uuid, p_quantity int)
returns orders language plpgsql security definer as $$
declare
  v_order   orders%rowtype;
  v_gb      group_buys%rowtype;
  v_product products%rowtype;
  v_delta   int;
  v_remaining int;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then raise exception '주문을 찾을 수 없습니다'; end if;
  if v_order.user_id is distinct from auth.uid() then raise exception '본인 주문만 변경할 수 있습니다'; end if;
  if v_order.status not in ('received','incoming') then raise exception '변경할 수 없는 상태입니다'; end if;

  select * into v_gb from group_buys where id = v_order.group_buy_id for update;
  if v_gb.sale_end < now() then raise exception '주문이 마감되어 변경할 수 없습니다'; end if;
  select * into v_product from products where id = v_order.product_id;

  if p_quantity < 1 then raise exception '수량은 1개 이상이어야 합니다'; end if;
  if p_quantity > coalesce(v_product.max_per_person, 999) then raise exception '1인 최대 수량을 초과했습니다'; end if;

  v_delta := p_quantity - v_order.quantity;
  if v_gb.total_qty is not null then
    v_remaining := v_gb.total_qty - coalesce(v_gb.ordered_qty, 0);
    if v_delta > v_remaining then raise exception '남은 수량이 부족합니다'; end if;
  end if;

  update orders set quantity = p_quantity, total_price = v_order.unit_price * p_quantity
    where id = p_order_id returning * into v_order;
  update group_buys set ordered_qty = coalesce(ordered_qty, 0) + v_delta where id = v_gb.id;
  return v_order;
end; $$;

create or replace function cancel_my_order(p_order_id uuid)
returns orders language plpgsql security definer as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then raise exception '주문을 찾을 수 없습니다'; end if;
  if v_order.user_id is distinct from auth.uid() then raise exception '본인 주문만 취소할 수 있습니다'; end if;
  if v_order.status not in ('received','incoming') then raise exception '취소할 수 없는 상태입니다'; end if;

  update orders set status = 'canceled', cancel_reason = '고객 취소'
    where id = p_order_id returning * into v_order;
  update group_buys set ordered_qty = greatest(0, coalesce(ordered_qty, 0) - v_order.quantity)
    where id = v_order.group_buy_id;
  return v_order;
end; $$;
