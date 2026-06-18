import Link from "next/link"
import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/OwnerHeader"
import { formatPrice } from "@/lib/format"
import { todaySeoul } from "@/lib/date"
import type { Order } from "@/types/db"

export default async function OwnerDashboard() {
  const store = await requireOwner()
  const supabase = await createClient()
  const { data } = await supabase.from("orders").select("*").eq("store_id", store.id)
  const orders = (data as Order[]) ?? []
  const today = todaySeoul()

  const todayOrders = orders.filter((o) => o.pickup_date === today)
  const todayPending = todayOrders.filter((o) => o.status === "received" || o.status === "incoming")
  const todayPicked = todayOrders.filter((o) => o.status === "picked_up")
  const newOrders = orders.filter((o) => o.status === "received")
  const expectedRevenue = todayOrders
    .filter((o) => o.status !== "canceled" && o.status !== "no_show")
    .reduce((sum, o) => sum + o.total_price, 0)

  const stats = [
    { label: "오늘 픽업 예정", value: `${todayPending.length}건` },
    { label: "픽업 완료", value: `${todayPicked.length}건` },
    { label: "미픽업", value: `${todayPending.length}건` },
    { label: "신규 주문", value: `${newOrders.length}건` },
  ]

  return (
    <>
      <OwnerHeader storeName={store.name} />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">오늘의 현황</h1>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm text-emerald-700">예상 현장 결제액</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{formatPrice(expectedRevenue)}</p>
        </div>

        <Link
          href="/owner/orders"
          className="mt-6 block rounded-xl bg-gray-900 py-3.5 text-center font-semibold text-white hover:bg-gray-800"
        >
          주문 목록 보기
        </Link>
      </main>
    </>
  )
}
