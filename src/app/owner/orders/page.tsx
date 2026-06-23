import Link from "next/link"
import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/OwnerHeader"
import { OwnerRealtime } from "@/components/OwnerRealtime"
import { OwnerOrdersList } from "@/components/OwnerOrdersList"
import { ORDER_STATUS } from "@/lib/constants"
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
  const rows = orders.map((o) => ({
    id: o.id,
    order_no: o.order_no,
    status: o.status,
    product_name: o.product_name,
    quantity: o.quantity,
    customer_name: o.customer_name,
    phone: o.phone,
    pickup_date: o.pickup_date,
    hasNote: !!o.request_note,
  }))

  return (
    <>
      <OwnerHeader storeName={store.name} />
      <OwnerRealtime storeId={store.id} />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">주문 목록</h1>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const active = (f.key === "all" && !status) || status === f.key
            return (
              <Link
                key={f.key}
                prefetch={false}
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

        <OwnerOrdersList orders={rows} />
      </main>
    </>
  )
}
