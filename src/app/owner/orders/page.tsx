import Link from "next/link"
import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/OwnerHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { ORDER_STATUS } from "@/lib/constants"
import { phoneLast4, formatDate } from "@/lib/format"
import type { Order, OrderStatus } from "@/types/db"

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "received", label: "주문 접수" },
  { key: "incoming", label: "입고 완료" },
  { key: "picked_up", label: "픽업 완료" },
  { key: "canceled", label: "취소" },
  { key: "no_show", label: "미수령" },
]

export default async function OwnerOrdersPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  const store = await requireOwner()
  const { status } = await props.searchParams
  const supabase = await createClient()

  let query = supabase.from("orders").select("*").eq("store_id", store.id).order("created_at", { ascending: false })
  if (status && status !== "all" && status in ORDER_STATUS) {
    query = query.eq("status", status)
  }
  const { data } = await query
  const orders = (data as Order[]) ?? []

  return (
    <>
      <OwnerHeader storeName={store.name} />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">주문 목록</h1>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const active = (f.key === "all" && !status) || status === f.key
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/owner/orders" : `/owner/orders?status=${f.key}`}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${
                  active ? "border-gray-900 bg-gray-900 text-white" : "border-gray-300 bg-white text-gray-700"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>

        {orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500">주문이 없습니다.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/owner/orders/${o.id}`}
                  className="block rounded-2xl border border-gray-200 bg-white p-4 hover:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{o.order_no}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 font-semibold">{o.product_name} · {o.quantity}개</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {o.customer_name} ({phoneLast4(o.phone)}) · 픽업 {formatDate(o.pickup_date)}
                    {o.request_note ? " · 📝요청사항" : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  )
}
