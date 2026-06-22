import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { OpenChatButton } from "@/components/OpenChatButton"
import { formatPrice, formatDate } from "@/lib/format"
import { COPY } from "@/lib/constants"
import type { Order } from "@/types/db"

async function fetchOrders(nos: string[]): Promise<Order[]> {
  if (!isSupabaseConfigured || nos.length === 0) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("orders").select("*").in("order_no", nos)
    return (data as Order[]) ?? []
  } catch {
    return []
  }
}

export default async function OrderCompletePage(props: {
  searchParams: Promise<{ no?: string; nos?: string }>
}) {
  const { no = "", nos = "" } = await props.searchParams
  const orderNos = (nos ? nos.split(",") : no ? [no] : []).map((s) => s.trim()).filter(Boolean)
  const orders = await fetchOrders(orderNos)
  const totalPrice = orders.reduce((s, o) => s + o.total_price, 0)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-10">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-3 text-xl font-bold text-emerald-800">
          {orderNos.length > 1 ? `${orderNos.length}건의 주문이 접수되었습니다` : "주문이 접수되었습니다"}
        </h1>
        <p className="mt-2 whitespace-pre-line text-sm text-emerald-700">{COPY.orderComplete}</p>
      </div>

      {orders.length > 0 && (
        <section className="mt-4 space-y-2">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-sky-100 bg-white p-4 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold">{o.product_name}</span>
                <span className="text-xs text-gray-400">{o.order_no}</span>
              </div>
              <Row label="수량" value={`${o.quantity}개`} />
              <Row label="결제 예정액" value={formatPrice(o.total_price)} />
              <Row label="픽업 예정일" value={formatDate(o.pickup_date)} />
            </div>
          ))}
          {orders.length > 1 && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-right text-sm font-bold text-emerald-800">
              총 결제 예정액 {formatPrice(totalPrice)}
            </div>
          )}
        </section>
      )}

      <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="whitespace-pre-line">{COPY.payAtStore}</p>
      </section>

      <div className="mt-6 space-y-2">
        <OpenChatButton />
        <Link href="/order/lookup" className="block rounded-xl border border-gray-300 bg-white py-3 text-center font-medium hover:bg-gray-50">
          내 주문 내역 보기
        </Link>
        <Link href="/" className="block rounded-xl border border-gray-300 bg-white py-3 text-center font-medium hover:bg-gray-50">
          상품 목록 다시 보기
        </Link>
      </div>
    </main>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="flex-1 font-medium">{value}</span>
    </div>
  )
}
