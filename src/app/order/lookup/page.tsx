import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { isClosed, formatPrice } from "@/lib/format"
import { customerLogoutAction } from "@/app/auth/actions"
import { MyOrderCard } from "@/components/MyOrderCard"
import type { Order } from "@/types/db"

type OrderRow = Order & {
  group_buy: { sale_end: string } | null
  store: { name: string; address: string | null } | null
}

function nickname(m: Record<string, unknown> | undefined): string {
  if (!m) return "고객"
  return (
    (m.name as string) || (m.full_name as string) || (m.nickname as string) ||
    (m.preferred_username as string) || "고객"
  )
}

export default async function MyOrdersPage() {
  let name = "고객"
  let orders: OrderRow[] = []

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        name = nickname(user.user_metadata as Record<string, unknown>)
        const { data } = await supabase
          .from("orders")
          .select("*, group_buy:group_buys(sale_end), store:stores(name,address)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
        orders = (data as unknown as OrderRow[]) ?? []
      }
    } catch { /* 무시 */ }
  }

  // 취소 건은 고객 화면에서 숨김 (기록은 DB/관리자에 남음)
  const visible = orders.filter((o) => o.status !== "canceled")
  // 픽업 예정(접수·입고) 건 기준 합계
  const active = orders.filter((o) => o.status === "received" || o.status === "incoming")
  const totalQty = active.reduce((s, o) => s + o.quantity, 0)
  const totalPrice = active.reduce((s, o) => s + o.total_price, 0)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-8 pb-28">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-700">← 홈으로</Link>
        <form action={customerLogoutAction}>
          <button className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </form>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm font-semibold text-blue-400">My Page</p>
        <h1 className="mt-1 inline-block border-b-4 border-blue-700 pb-1 text-xl font-extrabold text-gray-900">
          안녕하세요 {name} 님
        </h1>
      </div>

      {visible.length === 0 ? (
        <p className="mt-8 rounded-xl border border-sky-100 bg-white py-12 text-center text-sm text-gray-500">
          아직 예약 내역이 없습니다.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((o) => {
            const editable =
              (o.status === "received" || o.status === "incoming") &&
              !(o.group_buy && isClosed(o.group_buy.sale_end))
            return (
              <MyOrderCard
                key={o.id}
                orderId={o.id}
                orderNo={o.order_no}
                productId={o.product_id}
                status={o.status}
                storeName={o.store?.name ?? "-"}
                storeAddress={o.store?.address ?? null}
                productName={o.product_name}
                unitPrice={o.unit_price}
                quantity={o.quantity}
                pickupDate={o.pickup_date}
                saleEnd={o.group_buy?.sale_end ?? null}
                editable={editable}
              />
            )
          })}
        </ul>
      )}

      {visible.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-4">
          <div className="mx-auto flex max-w-screen-md items-center justify-between text-sm">
            <span className="font-semibold text-gray-700">
              픽업가능 총수량 <span className="text-gray-900">{totalQty}개</span>
            </span>
            <span className="font-semibold text-gray-700">
              픽업 총금액 <span className="text-lg font-extrabold text-red-500">{formatPrice(totalPrice)}</span>
            </span>
          </div>
        </div>
      )}
    </main>
  )
}
