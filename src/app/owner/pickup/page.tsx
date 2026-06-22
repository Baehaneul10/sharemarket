import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/OwnerHeader"
import { OwnerRealtime } from "@/components/OwnerRealtime"
import { PickupChecklist } from "@/components/PickupChecklist"
import { todaySeoul } from "@/lib/date"
import { formatDate } from "@/lib/format"
import type { Order } from "@/types/db"

// 오늘 픽업 예정 주문을 체크리스트로 보고, 선택해서 일괄 입고/픽업 처리
export default async function OwnerPickupPage() {
  const store = await requireOwner()
  const today = todaySeoul()
  const supabase = await createClient()
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("store_id", store.id)
    .eq("pickup_date", today)
    .in("status", ["received", "incoming"])
    .order("status", { ascending: true })
    .order("order_no", { ascending: true })
  const orders = (data as Order[]) ?? []
  const rows = orders.map((o) => ({
    id: o.id,
    order_no: o.order_no,
    customer_name: o.customer_name,
    product_name: o.product_name,
    quantity: o.quantity,
    total_price: o.total_price,
    status: o.status,
    phone: o.phone,
  }))

  return (
    <>
      <OwnerHeader storeName={store.name} />
      <OwnerRealtime storeId={store.id} />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">오늘 픽업 · {formatDate(today)}</h1>
        <p className="mt-1 text-sm text-gray-500">처리할 {rows.length}건. 체크해서 한 번에 처리하거나 인쇄해서 사용하세요.</p>
        <div className="mt-4">
          <PickupChecklist orders={rows} />
        </div>
      </main>
    </>
  )
}
