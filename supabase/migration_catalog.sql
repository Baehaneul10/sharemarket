-- ============================================================
-- 상품 단독 노출/주문 마이그레이션
-- (공구 없이도 '노출' 체크된 상품을 바로 주문할 수 있게)
-- 사용법: Supabase → SQL Editor → New query 에 붙여넣고 Run
-- ============================================================

-- 1) 주문이 공구에 묶이지 않아도 되도록 group_buy_id 를 선택값으로
alter table orders alter column group_buy_id drop not null;

-- 2) 공구 없이 상품을 바로 주문하는 함수 (픽업일 = 주문일 + 2일, D+2)
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
begin
  v_uid := auth.uid();
  if v_uid is null then raise exception '로그인이 필요합니다'; end if;

  select * into v_product from products where id = p_product_id;
  if not found then raise exception '존재하지 않는 상품입니다'; end if;
  if not v_product.is_visible then raise exception '판매 중인 상품이 아닙니다'; end if;
  if p_quantity < 1 then raise exception '수량은 1개 이상이어야 합니다'; end if;
  if p_quantity > coalesce(v_product.max_per_person, 999) then raise exception '1인 최대 수량을 초과했습니다'; end if;

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
  return v_order;
end; $$;
