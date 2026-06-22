-- ============================================================
-- 상품별 재고 수량 + 실시간 남은수량/SOLD OUT
-- 사용법: Supabase → SQL Editor → New query 에 전체 붙여넣고 Run
-- (group_buys의 total_qty/ordered_qty 방식을 상품에 동일 적용)
-- ============================================================

-- 1) 상품 재고 컬럼: stock(총 재고, 비우면 무제한) + ordered_qty(주문 누적)
alter table products add column if not exists stock int;
alter table products add column if not exists ordered_qty int default 0;

-- 2) 상품 단독 주문: 재고 확인 후 차감 (재고 없으면(무제한) 그냥 통과)
create or replace function create_product_order(
  p_product_id   uuid,
  p_store_id     uuid,
  p_quantity     int,
  p_customer_name text,
  p_email        text
) returns orders language plpgsql security definer as $$
declare
  v_product products%rowtype;
  v_order   orders%rowtype;
  v_order_no text;
  v_today   text;
  v_uid     uuid;
  v_pickup  date;
  v_remaining int;
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;

  select * into v_product from products where id = p_product_id for update;  -- 동시 주문 잠금
  if not found then raise exception '존재하지 않는 상품입니다'; end if;
  if not v_product.is_visible then raise exception '판매 중인 상품이 아닙니다'; end if;
  if p_quantity < 1 then raise exception '수량은 1개 이상이어야 합니다'; end if;
  if p_quantity > coalesce(v_product.max_per_person, 999) then raise exception '1인 최대 수량을 초과했습니다'; end if;

  if v_product.stock is not null then
    v_remaining := v_product.stock - coalesce(v_product.ordered_qty, 0);
    if p_quantity > v_remaining then raise exception '남은 수량이 부족합니다'; end if;
  end if;

  v_today := to_char((now() at time zone 'Asia/Seoul'), 'YYYYMMDD');
  v_order_no := next_order_no(v_today);
  v_pickup := (now() at time zone 'Asia/Seoul')::date + 2;

  insert into orders (
    order_no, group_buy_id, product_id, product_name, store_id,
    customer_name, phone, email, user_id, quantity, unit_price, total_price,
    privacy_agreed, status, pickup_date
  ) values (
    v_order_no, null, v_product.id, v_product.name, p_store_id,
    p_customer_name, null, p_email, v_uid, p_quantity, v_product.group_price, v_product.group_price * p_quantity,
    true, 'received', v_pickup
  ) returning * into v_order;

  update products set ordered_qty = coalesce(ordered_qty, 0) + p_quantity where id = v_product.id;
  return v_order;
end; $$;

-- 3) 마이페이지 수량 변경: 공구/상품 모두 재고 반영
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
  if p_quantity < 1 then raise exception '수량은 1개 이상이어야 합니다'; end if;

  v_delta := p_quantity - v_order.quantity;

  if v_order.group_buy_id is not null then
    -- 공구 주문
    select * into v_gb from group_buys where id = v_order.group_buy_id for update;
    if v_gb.sale_end < now() then raise exception '주문이 마감되어 변경할 수 없습니다'; end if;
    select * into v_product from products where id = v_order.product_id;
    if p_quantity > coalesce(v_product.max_per_person, 999) then raise exception '1인 최대 수량을 초과했습니다'; end if;
    if v_gb.total_qty is not null then
      v_remaining := v_gb.total_qty - coalesce(v_gb.ordered_qty, 0);
      if v_delta > v_remaining then raise exception '남은 수량이 부족합니다'; end if;
    end if;
    update orders set quantity = p_quantity, total_price = v_order.unit_price * p_quantity
      where id = p_order_id returning * into v_order;
    update group_buys set ordered_qty = coalesce(ordered_qty, 0) + v_delta where id = v_gb.id;
  else
    -- 상품 단독 주문
    select * into v_product from products where id = v_order.product_id for update;
    if p_quantity > coalesce(v_product.max_per_person, 999) then raise exception '1인 최대 수량을 초과했습니다'; end if;
    if v_product.stock is not null then
      v_remaining := v_product.stock - coalesce(v_product.ordered_qty, 0);
      if v_delta > v_remaining then raise exception '남은 수량이 부족합니다'; end if;
    end if;
    update orders set quantity = p_quantity, total_price = v_order.unit_price * p_quantity
      where id = p_order_id returning * into v_order;
    update products set ordered_qty = coalesce(ordered_qty, 0) + v_delta where id = v_product.id;
  end if;

  return v_order;
end; $$;

-- 4) 마이페이지 취소: 공구/상품 모두 재고 복구
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

  if v_order.group_buy_id is not null then
    update group_buys set ordered_qty = greatest(0, coalesce(ordered_qty, 0) - v_order.quantity)
      where id = v_order.group_buy_id;
  else
    update products set ordered_qty = greatest(0, coalesce(ordered_qty, 0) - v_order.quantity)
      where id = v_order.product_id;
  end if;
  return v_order;
end; $$;

-- 5) 실시간: products 테이블 변경(남은수량) 구독 활성화
do $$
begin
  alter publication supabase_realtime add table products;
exception
  when duplicate_object then null;
end $$;
alter table products replica identity full;
