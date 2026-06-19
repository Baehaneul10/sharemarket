import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { StatusBadge } from "@/components/StatusBadge"
import { formatPrice, formatDate, isClosed } from "@/lib/format"
import { updateMyOrderQtyAction, cancelMyOrderAction } from "@/app/order/actions"
import { customerLogoutAction } from "@/app/auth/actions"
import type { Order } from "@/types/db"

type OrderRow = Order & { group_buy: { sale_end: string } | null }

async function fetchMyOrders(): Promise<OrderRow[]> {
  if (!isSupabaseConfigured) return []
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    const { data } = await supabase
      .from("orders")
      .select("*, group_buy:group_buys(sale_end)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    return (data as unknown as OrderRow[]) ?? []
  } catch {
    return []
  }
}

export default async function MyOrdersPage() {
  const orders = await fetchMyOrders()

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-8">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-700">← 홈으로</Link>
        <form action={customerLogoutAction}>
          <button className="text-sm text-gray-400 hover:text-gray-600">로그아웃</button>
        </form>
      </div>
      <h1 className="mt-2 text-xl font-bold">마이페이지 · 내 예약</h1>
      <p className="mt-1 text-sm text-gray-500">카카오 로그인 계정으로 접수한 예약이에요.</p>

      {orders.length === 0 ? (
        <p className="mt-6 rounded-xl border border-sky-100 bg-white py-12 text-center text-sm text-gray-500">
          아직 예약 내역이 없습니다.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((o) => {
            const editable =
              (o.status === "received" || o.status === "incoming") &&
              !(o.group_buy && isClosed(o.group_buy.sale_end))
            return (
              <li key={o.id} className="rounded-2xl border border-sky-100 bg-white p-4 text-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs text-gray-400">{o.order_no}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="font-semibold">{o.product_name}</p>
                <p className="mt-0.5 text-gray-500">
                  {o.quantity}개 · {formatPrice(o.total_price)} · 픽업 {formatDate(o.pickup_date)}
                </p>
                <p className="mt-0.5 text-gray-400">결제 방식: 매장 현장 결제</p>

                {editable && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                    <form action={updateMyOrderQtyAction} className="flex items-center gap-1.5">
                      <input type="hidden" name="order_id" value={o.id} />
                      <span className="text-xs text-gray-500">수량</span>
                      <input
                        name="quantity" type="number" min={1} defaultValue={o.quantity}
                        className="w-16 rounded-lg border border-gray-300 px-2 py-1.5"
                      />
                      <button className="rounded-lg bg-sky-500 px-3 py-1.5 font-medium text-white hover:bg-sky-600">
                        수량 적용
                      </button>
                    </form>
                    <form action={cancelMyOrderAction}>
                      <input type="hidden" name="order_id" value={o.id} />
                      <button className="rounded-lg border border-red-300 px-3 py-1.5 font-medium text-red-600 hover:bg-red-50">
                        예약 취소
                      </button>
                    </form>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
