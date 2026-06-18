import Link from "next/link"
import { notFound } from "next/navigation"
import { getGroupBuyById, getActiveStores } from "@/lib/queries"
import { isClosed, remainingQty, formatPrice, formatDate } from "@/lib/format"
import { OrderForm } from "./OrderForm"

export default async function OrderPage(props: {
  params: Promise<{ groupBuyId: string }>
}) {
  const { groupBuyId } = await props.params
  const gb = await getGroupBuyById(groupBuyId)
  if (!gb || !gb.product) notFound()

  const stores = await getActiveStores()
  const participating = gb.store_ids?.length
    ? stores.filter((s) => gb.store_ids.includes(s.id))
    : stores
  const remaining = remainingQty(gb.total_qty, gb.ordered_qty)
  const closed = isClosed(gb.sale_end) || (remaining !== null && remaining <= 0)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-16">
      <header className="-mx-4 mb-4 bg-emerald-600 px-4 py-5 text-white">
        <Link href={`/products/${gb.product.id}`} className="text-sm text-emerald-50">← 상품으로</Link>
        <h1 className="mt-1 text-lg font-bold">예약 주문하기</h1>
      </header>

      <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <p className="font-semibold">{gb.product.name}</p>
        <p className="mt-1 text-emerald-600 font-bold">{formatPrice(gb.product.group_price)}</p>
        <p className="mt-1 text-xs text-gray-500">
          픽업일 {formatDate(gb.pickup_date)} · 마감 {formatDate(gb.sale_end)}
          {remaining !== null && ` · 남은 수량 ${remaining}개`}
        </p>
      </div>

      {closed ? (
        <p className="rounded-xl border border-gray-200 bg-white py-12 text-center text-sm text-gray-500">
          마감된 공구입니다.
        </p>
      ) : (
        <OrderForm
          groupBuyId={gb.id}
          maxPerPerson={gb.product.max_per_person}
          remaining={remaining}
          stores={participating.map((s) => ({ id: s.id, name: s.name, pickup_hours: s.pickup_hours }))}
        />
      )}
    </main>
  )
}
