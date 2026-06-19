import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { OpenChatButton } from "@/components/OpenChatButton"
import { formatPrice, formatDate } from "@/lib/format"
import { COPY } from "@/lib/constants"
import type { Order } from "@/types/db"

async function fetchOrder(no: string): Promise<Order | null> {
  if (!isSupabaseConfigured || !no) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase.from("orders").select("*").eq("order_no", no).maybeSingle()
    return (data as Order) ?? null
  } catch {
    return null
  }
}

export default async function OrderCompletePage(props: {
  searchParams: Promise<{ no?: string }>
}) {
  const { no = "" } = await props.searchParams
  const order = await fetchOrder(no)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-10">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="text-4xl">✅</div>
        <h1 className="mt-3 text-xl font-bold text-emerald-800">주문이 접수되었습니다</h1>
        <p className="mt-2 whitespace-pre-line text-sm text-emerald-700">{COPY.orderComplete}</p>
        {no && <p className="mt-3 text-sm font-medium text-emerald-900">주문번호 {no}</p>}
      </div>

      {order && (
        <section className="mt-4 rounded-2xl border border-sky-100 bg-white p-4 text-sm">
          <Row label="상품" value={order.product_name} />
          <Row label="수량" value={`${order.quantity}개`} />
          <Row label="결제 예정액" value={formatPrice(order.total_price)} />
          <Row label="픽업 예정일" value={formatDate(order.pickup_date)} />
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
