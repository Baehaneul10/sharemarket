import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { ORDER_STATUS } from "@/lib/constants"
import type { Order, Store } from "@/types/db"

function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v)
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET() {
  await requireAdmin() // 미인증 시 /admin/login 으로 redirect

  const db = createAdminClient()
  const [{ data: ordersData }, { data: storesData }] = await Promise.all([
    db.from("orders").select("*").order("created_at", { ascending: false }),
    db.from("stores").select("*"),
  ])
  const orders = (ordersData as Order[]) ?? []
  const stores = (storesData as Store[]) ?? []
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? ""

  const headers = [
    "주문번호", "주문일시", "상품명", "수량", "단가", "결제예정액",
    "고객명", "이메일", "휴대폰", "픽업매장", "픽업예정일", "상태", "요청사항", "메모",
  ]
  const rows = orders.map((o) => [
    o.order_no,
    o.created_at,
    o.product_name,
    o.quantity,
    o.unit_price,
    o.total_price,
    o.customer_name,
    o.email ?? "",
    o.phone ?? "",
    storeName(o.store_id),
    o.pickup_date ?? "",
    ORDER_STATUS[o.status]?.label ?? o.status,
    o.request_note ?? "",
    o.memo ?? "",
  ])

  const csv = [headers, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n")
  // UTF-8 BOM 추가 → Excel에서 한글 깨짐 방지
  const body = "﻿" + csv

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders.csv"`,
    },
  })
}
