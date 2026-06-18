-- ============================================================
-- 영영상점 DB 스키마
-- 사용법: Supabase 대시보드 → SQL Editor → New query 에 전체 붙여넣고 Run
-- ============================================================

-- ========== 1) 매장 ==========
create table if not exists stores (
  id            uuid primary key default gen_random_uuid(),
  brand         text,
  name          text not null,
  owner_name    text,
  phone         text,
  address       text,
  pickup_hours  text,
  is_active     boolean default true,
  openchat_url  text,
  auth_user_id  uuid references auth.users,
  sort_order    int default 0,
  created_at    timestamptz default now()
);

-- ========== 2) 상품 ==========
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text,
  thumbnail_url  text,
  images         jsonb default '[]',
  description    text,
  composition    text,
  normal_price   int,
  group_price    int not null,
  supply_price   int,
  storage        text,
  origin         text,
  expiry         text,
  allergy        text,
  max_per_person int default 3,
  is_visible     boolean default true,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ========== 3) 공구 회차 ==========
create table if not exists group_buys (
  id            uuid primary key default gen_random_uuid(),
  product_id    uuid not null references products(id) on delete cascade,
  title         text,
  sale_start    timestamptz,
  sale_end      timestamptz not null,
  pickup_date   date not null,
  store_ids     uuid[] default '{}',
  total_qty     int,
  ordered_qty   int default 0,
  status        text default 'selling',  -- ready/selling/closed/incoming/picking/done
  notice_text   text,
  openchat_url  text,
  created_at    timestamptz default now()
);

-- ========== 4) 주문 (핵심) ==========
create table if not exists orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text unique not null,
  group_buy_id    uuid not null references group_buys(id),
  product_id      uuid not null references products(id),
  product_name    text not null,
  store_id        uuid not null references stores(id),
  customer_name   text not null,
  phone           text not null,
  quantity        int not null check (quantity >= 1),
  unit_price      int not null,
  total_price     int not null,
  request_note    text,
  privacy_agreed  boolean not null default false,
  status          text not null default 'received', -- received/incoming/picked_up/canceled/no_show
  pickup_date     date,
  picked_up_at    timestamptz,
  handled_by      uuid references auth.users,
  paid            boolean,
  received_qty    int,
  cancel_reason   text,
  no_show_reason  text,
  memo            text,
  created_at      timestamptz default now()
);

create index if not exists orders_store_idx    on orders(store_id);
create index if not exists orders_groupbuy_idx on orders(group_buy_id);
create index if not exists orders_status_idx   on orders(status);

-- ========== 5) 공지 ==========
create table if not exists notices (
  id                uuid primary key default gen_random_uuid(),
  type              text,
  title             text not null,
  content           text not null,
  target_store_ids  uuid[] default '{}',
  target_product_id uuid references products(id),
  show_start        timestamptz,
  show_end          timestamptz,
  is_active         boolean default true,
  author            text,
  created_at        timestamptz default now()
);

-- ============================================================
-- 주문번호 안전 생성용 RPC (YY20260618-0001 형식)
-- ============================================================
create or replace function next_order_no(d text)
returns text language plpgsql as $$
declare n int;
begin
  select count(*) + 1 into n from orders where order_no like 'YY' || d || '-%';
  return 'YY' || d || '-' || lpad(n::text, 4, '0');
end; $$;

-- ============================================================
-- 주문 생성 RPC: 주문번호 발급 + 주문 INSERT + 공구 주문수량 증가 (원자적)
-- ============================================================
create or replace function create_order(
  p_group_buy_id uuid,
  p_store_id     uuid,
  p_customer_name text,
  p_phone        text,
  p_quantity     int,
  p_request_note text,
  p_privacy_agreed boolean
) returns orders language plpgsql security definer as $$
declare
  v_gb       group_buys%rowtype;
  v_product  products%rowtype;
  v_remaining int;
  v_order_no text;
  v_order    orders%rowtype;
  v_today    text;
begin
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
  if p_privacy_agreed is not true then raise exception '개인정보 수집 동의가 필요합니다'; end if;

  v_today := to_char((now() at time zone 'Asia/Seoul'), 'YYYYMMDD');
  v_order_no := next_order_no(v_today);

  insert into orders (
    order_no, group_buy_id, product_id, product_name, store_id,
    customer_name, phone, quantity, unit_price, total_price,
    request_note, privacy_agreed, status, pickup_date
  ) values (
    v_order_no, v_gb.id, v_product.id, v_product.name, p_store_id,
    p_customer_name, p_phone, p_quantity, v_product.group_price, v_product.group_price * p_quantity,
    p_request_note, p_privacy_agreed, 'received', v_gb.pickup_date
  ) returning * into v_order;

  update group_buys set ordered_qty = coalesce(ordered_qty, 0) + p_quantity where id = v_gb.id;

  return v_order;
end; $$;

-- ============================================================
-- 주문 조회 RPC: 주문번호 + 휴대폰 뒤 4자리로 본인 주문 조회 (완료/조회 페이지용)
-- security definer 로 RLS 우회하되, 정확한 주문번호+뒤4자리를 알아야만 조회 가능
-- ============================================================
create or replace function lookup_order(p_order_no text, p_phone_last4 text)
returns setof orders language sql security definer stable as $$
  select * from orders
  where order_no = p_order_no
    and right(regexp_replace(phone, '\D', '', 'g'), 4) = p_phone_last4;
$$;

-- ============================================================
-- RLS (행 수준 보안)
-- ============================================================
alter table products   enable row level security;
alter table group_buys enable row level security;
alter table stores     enable row level security;
alter table orders     enable row level security;
alter table notices    enable row level security;

-- 공개 읽기
drop policy if exists "public read products"   on products;
drop policy if exists "public read group_buys" on group_buys;
drop policy if exists "public read stores"     on stores;
drop policy if exists "public read notices"    on notices;
create policy "public read products"   on products   for select using (true);
create policy "public read group_buys" on group_buys for select using (true);
create policy "public read stores"     on stores     for select using (true);
create policy "public read notices"    on notices    for select using (true);

-- 고객 주문 생성: 누구나 INSERT (회원가입 없음). create_order RPC도 사용 가능.
drop policy if exists "anyone create order" on orders;
create policy "anyone create order" on orders for insert with check (true);

-- 점주: 자기 매장 주문만 조회/수정
drop policy if exists "owner read own orders"   on orders;
drop policy if exists "owner update own orders" on orders;
create policy "owner read own orders" on orders for select
  using (store_id in (select id from stores where auth_user_id = auth.uid()));
create policy "owner update own orders" on orders for update
  using (store_id in (select id from stores where auth_user_id = auth.uid()));

-- 본사 관리자 작업(상품/공구/매장/공지 CRUD, 전체 주문 조회)은 서버에서 service_role 키로 수행하여 RLS 우회.
