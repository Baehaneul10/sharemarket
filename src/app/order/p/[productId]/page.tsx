import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCatalogItem } from "@/lib/queries"
import { getSelectedStore } from "@/lib/store"
import { formatPrice } from "@/lib/format"
import { OrderForm } from "@/components/OrderForm"
import { createProductOrderAction } from "@/app/order/actions"

export default async function ProductOrderPage(props: {
  params: Promise<{ productId: string }>
}) {
  const { productId } = await props.params
  const store = await getSelectedStore()
  if (!store) redirect("/")

  const item = await getCatalogItem(productId, store.id)
  if (!item) notFound()

  // 진행 중인 공구가 있으면 공구 주문으로 보냄
  if (item.groupBuy) redirect(`/order/${item.groupBuy.id}`)

  const p = item.product

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-16">
      <header className="-mx-4 mb-4 bg-gradient-to-b from-blue-800 to-blue-700 px-4 py-5 text-white">
        <Link href={`/products/${p.id}`} className="text-sm text-sky-100">← 상품으로</Link>
        <h1 className="mt-1 text-lg font-bold">예약 주문하기</h1>
      </header>

      <div className="mb-4 rounded-2xl border border-sky-100 bg-white p-4">
        <p className="font-semibold">{p.name}</p>
        <p className="mt-1 text-blue-800 font-bold">{formatPrice(p.group_price)}</p>
        <p className="mt-1 text-xs text-gray-500">
          픽업 매장: {store.name}{store.pickup_hours ? ` (${store.pickup_hours})` : ""}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">주문하면 2일 뒤(D+2) 매장에서 픽업할 수 있어요.</p>
      </div>

      <OrderForm
        action={createProductOrderAction}
        fieldName="product_id"
        fieldValue={p.id}
        maxPerPerson={p.max_per_person}
        remaining={null}
      />
    </main>
  )
}
