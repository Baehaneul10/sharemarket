import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { StatusBadge } from "@/components/StatusBadge"
import { formatPrice, formatDate } from "@/lib/format"
import type { Order } from "@/types/db"

async function fetchOrder(no: string, last4: string): Promise<Order | null> {
  if (!isSupabaseConfigured || !no || !last4) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc("lookup_order", { p_order_no: no, p_phone_last4: last4 })
    const rows = (data as Order[]) ?? []
    return rows[0] ?? null
  } catch {
    return null
  }
}

export default async function LookupPage(props: {
  searchParams: Promise<{ no?: string; p?: string }>
}) {
  const { no = "", p = "" } = await props.searchParams
  const searched = Boolean(no && p)
  const order = await fetchOrder(no, p)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-8">
      <Link href="/" className="text-sm text-emerald-600">← 홈으로</Link>
      <h1 className="mt-2 text-xl font-bold">주문 조회</h1>
      <p className="mt-1 text-sm text-gray-500">주문번호와 휴대폰 뒤 4자리로 조회하세요.</p>

      <form method="get" className="mt-4 space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">주문번호</label>
          <input name="no" defaultValue={no} placeholder="YY20260618-0001" className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">휴대폰 뒤 4자리</label>
          <input name="p" defaultValue={p} inputMode="numeric" maxLength={4} placeholder="5678" className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
        </div>
        <button type="submit" className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">
          조회하기
        </button>
      </form>

      {searched && (
        order ? (
          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold">{order.order_no}</span>
              <StatusBadge status={order.status} />
            </div>
            <Row label="상품" value={order.product_name} />
            <Row label="수량" value={`${order.quantity}개`} />
            <Row label="결제 예정액" value={formatPrice(order.total_price)} />
            <Row label="결제 방식" value="매장 현장 결제" />
            <Row label="픽업 예정일" value={formatDate(order.pickup_date)} />
            {order.request_note && <Row label="요청사항" value={order.request_note} />}
          </section>
        ) : (
          <p className="mt-4 rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-500">
            일치하는 주문을 찾을 수 없습니다.
          </p>
        )
      )}
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
