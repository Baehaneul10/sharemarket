import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getGroupBuyById } from "@/lib/queries"
import { getSelectedStore } from "@/lib/store"
import { isClosed, remainingQty, formatPrice, formatDate } from "@/lib/format"
import { OrderForm } from "@/components/OrderForm"
import { createOrderAction } from "@/app/order/actions"

export default async function OrderPage(props: {
  params: Promise<{ groupBuyId: string }>
}) {
  const { groupBuyId } = await props.params
  const gb = await getGroupBuyById(groupBuyId)
  if (!gb || !gb.product) notFound()

  const store = await getSelectedStore()
  if (!store) redirect("/") // 지점 미지정 → 안내 화면으로

  const remaining = remainingQty(gb.total_qty, gb.ordered_qty)
  const closed = isClosed(gb.sale_end) || (remaining !== null && remaining <= 0)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-16">
      <header className="-mx-4 mb-4 bg-gradient-to-b from-blue-800 to-blue-700 px-4 py-5 text-white">
        <Link href={`/products/${gb.product.id}`} className="text-sm text-sky-100">← 상품으로</Link>
        <h1 className="mt-1 text-lg font-bold">예약 주문하기</h1>
      </header>

      <div className="mb-4 rounded-2xl border border-sky-100 bg-white p-4">
        <p className="font-semibold">{gb.product.name}</p>
        <p className="mt-1 text-blue-800 font-bold">{formatPrice(gb.product.group_price)}</p>
        <p className="mt-1 text-xs text-gray-500">
          픽업 매장: {store.name}{store.pickup_hours ? ` (${store.pickup_hours})` : ""}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          픽업일 {formatDate(gb.pickup_date)} · 마감 {formatDate(gb.sale_end)}
          {remaining !== null && ` · 남은 수량 ${remaining}개`}
        </p>
      </div>

      {closed ? (
        <p className="rounded-xl border border-sky-100 bg-white py-12 text-center text-sm text-gray-500">
          마감된 공구입니다.
        </p>
      ) : (
        <OrderForm
          action={createOrderAction}
          fieldName="group_buy_id"
          fieldValue={gb.id}
          maxPerPerson={gb.product.max_per_person}
          remaining={remaining}
        />
      )}
    </main>
  )
}
