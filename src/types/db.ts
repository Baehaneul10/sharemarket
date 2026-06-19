// 영영상점 DB 테이블 TypeScript 타입 (supabase/schema.sql 과 1:1 대응)

export type OrderStatus =
  | "received"   // 주문 접수
  | "incoming"   // 입고 완료
  | "picked_up"  // 픽업 완료
  | "canceled"   // 취소
  | "no_show"    // 미수령

export type GroupBuyStatus =
  | "ready" | "selling" | "closed" | "incoming" | "picking" | "done"

export interface Store {
  id: string
  brand: string | null
  name: string
  slug: string | null
  owner_name: string | null
  phone: string | null
  address: string | null
  pickup_hours: string | null
  is_active: boolean
  openchat_url: string | null
  auth_user_id: string | null
  sort_order: number
  created_at: string
}

export interface Product {
  id: string
  name: string
  category: string | null
  thumbnail_url: string | null
  images: string[]
  description: string | null
  composition: string | null
  normal_price: number | null
  group_price: number
  supply_price: number | null
  storage: string | null
  origin: string | null
  expiry: string | null
  allergy: string | null
  max_per_person: number
  store_ids: string[]
  is_visible: boolean
  created_at: string
  updated_at: string
}

export interface GroupBuy {
  id: string
  product_id: string
  title: string | null
  sale_start: string | null
  sale_end: string
  pickup_date: string
  store_ids: string[]
  total_qty: number | null
  ordered_qty: number
  status: GroupBuyStatus
  notice_text: string | null
  openchat_url: string | null
  created_at: string
}

export interface Order {
  id: string
  order_no: string
  group_buy_id: string
  product_id: string
  product_name: string
  store_id: string
  user_id: string | null
  customer_name: string
  phone: string | null
  email: string | null
  quantity: number
  unit_price: number
  total_price: number
  request_note: string | null
  privacy_agreed: boolean
  status: OrderStatus
  pickup_date: string | null
  picked_up_at: string | null
  handled_by: string | null
  paid: boolean | null
  received_qty: number | null
  cancel_reason: string | null
  no_show_reason: string | null
  memo: string | null
  created_at: string
}

export interface Notice {
  id: string
  type: string | null
  title: string
  content: string
  target_store_ids: string[]
  target_product_id: string | null
  show_start: string | null
  show_end: string | null
  is_active: boolean
  author: string | null
  created_at: string
}

// 조인 결과 편의 타입
export type GroupBuyWithProduct = GroupBuy & { product: Product }
export type OrderWithStore = Order & { store: Store | null }
