import type { GroupBuy, Product, Store } from "@/types/db"
import { formatDate, formatPrice } from "./format"
import { BRAND } from "./constants"

// 점주용 공지문 자동 생성 (기획서 5-7)
export function buildNoticeText(opts: {
  product: Product
  groupBuy: GroupBuy
  store?: Store | null
  orderUrl: string
}): string {
  const { product, groupBuy, store, orderUrl } = opts
  const lines = [
    `[${BRAND} 오늘의 공구]`,
    product.name,
    product.normal_price
      ? `정상가 ${formatPrice(product.normal_price)} → 공구가 ${formatPrice(product.group_price)}`
      : `공구가 ${formatPrice(product.group_price)}`,
    `주문 마감: ${formatDate(groupBuy.sale_end)}`,
    `픽업일: ${formatDate(groupBuy.pickup_date)}`,
    store ? `픽업 장소: ${store.name}` : null,
    `주문 링크: ${orderUrl}`,
  ].filter(Boolean)
  return lines.join("\n")
}
