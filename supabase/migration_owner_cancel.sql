-- ============================================================
-- 점주 주문 취소 시 재고 복구 (고객 화면 남은수량에 반영)
-- 사용법: Supabase → SQL Editor → New query 에 붙여넣고 Run
-- ============================================================

create or replace function owner_cancel_order(p_order_id uuid, p_reason text default '점주 취소')
returns void language plpgsql security definer as $$
declare
  v_order orders%rowtype;
begin
  select * into v_order from orders where id = p_order_id;
  if not found then return; end if;

  -- 점주 본인 매장 주문만 취소 가능
  if not exists (
    select 1 from stores where id = v_order.store_id and auth_user_id = auth.uid()
  ) then
    raise exception '권한이 없습니다';
  end if;

  -- 이미 완료/취소된 주문은 건드리지 않음
  if v_order.status not in ('received', 'incoming') then return; end if;

  update orders
    set status = 'canceled', cancel_reason = coalesce(nullif(p_reason, ''), '점주 취소')
    where id = p_order_id;

  -- 재고 복구: 공구는 group_buys, 상품 단독은 products
  if v_order.group_buy_id is not null then
    update group_buys set ordered_qty = greatest(0, coalesce(ordered_qty, 0) - v_order.quantity)
      where id = v_order.group_buy_id;
  else
    update products set ordered_qty = greatest(0, coalesce(ordered_qty, 0) - v_order.quantity)
      where id = v_order.product_id;
  end if;
end; $$;
