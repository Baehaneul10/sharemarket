import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getCatalogItem } from "@/lib/queries"
import { getSelectedStore } from "@/lib/store"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"
import { COPY } from "@/lib/constants"

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const store = await getSelectedStore()
  if (!store) redirect("/")

  const item = await getCatalogItem(id, store.id)
  if (!item) notFound()

  const p = item.product
  const gb = item.groupBuy
  const remaining = gb ? remainingQty(gb.total_qty, gb.ordered_qty) : null
  const closed = gb ? isClosed(gb.sale_end) || (remaining !== null && remaining <= 0) : false
  const orderHref = gb ? `/order/${gb.id}` : `/order/p/${p.id}`

  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex gap-3 py-1.5 text-sm">
        <span className="w-24 shrink-0 text-gray-500">{label}</span>
        <span className="flex-1">{value}</span>
      </div>
    ) : null

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-28">
      <div className="-mx-4 mb-4 flex aspect-square items-center justify-center bg-sky-50 text-sky-300">
        {p.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <span>이미지 준비중</span>
        )}
      </div>

      <Link href="/" className="text-sm text-blue-700">← 목록으로</Link>

      <h1 className="mt-2 text-xl font-bold">{p.name}</h1>
      <div className="mt-2 flex items-baseline gap-2">
        {p.normal_price && (
          <span className="text-gray-400 line-through">{formatPrice(p.normal_price)}</span>
        )}
        <span className="text-2xl font-bold text-blue-800">{formatPrice(p.group_price)}</span>
      </div>

      <section className="mt-5 rounded-2xl border border-sky-100 bg-white p-4">
        <h2 className="mb-2 font-semibold">상품 정보</h2>
        <Row label="구성" value={p.composition} />
        <Row label="보관방법" value={p.storage} />
        <Row label="유통기한" value={p.expiry} />
        <Row label="원산지" value={p.origin} />
        <Row label="알레르기" value={p.allergy} />
        {p.description && <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{p.description}</p>}
      </section>

      <section className="mt-4 rounded-2xl border border-sky-100 bg-white p-4">
        <h2 className="mb-2 font-semibold">픽업 안내</h2>
        {gb ? (
          <>
            <Row label="픽업 가능일" value={formatDate(gb.pickup_date)} />
            <Row label="주문 마감" value={formatDate(gb.sale_end)} />
            {remaining !== null && <Row label="남은 수량" value={`${remaining}개`} />}
          </>
        ) : (
          <Row label="픽업 안내" value="주문하면 2일 뒤(D+2) 매장에서 픽업할 수 있어요." />
        )}
        <Row label="최대 주문" value={`1인 ${p.max_per_person}개`} />
        <Row label="픽업 매장" value={store.name} />
      </section>

      <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="whitespace-pre-line">{COPY.beforeOrder}</p>
        <p className="mt-2 whitespace-pre-line">{COPY.payAtStore}</p>
      </section>

      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-screen-md">
          {closed ? (
            <button disabled className="w-full cursor-not-allowed rounded-xl bg-gray-200 py-3.5 font-semibold text-gray-500">
              마감되었습니다
            </button>
          ) : (
            <Link
              href={orderHref}
              className="block w-full rounded-xl bg-sky-500 py-3.5 text-center font-semibold text-white hover:bg-sky-600"
            >
              예약 주문하기
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
