import Link from "next/link"
import { notFound } from "next/navigation"
import { getGroupBuyByProductId, getActiveStores } from "@/lib/queries"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"
import { COPY } from "@/lib/constants"

export default async function ProductDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const gb = await getGroupBuyByProductId(id)
  if (!gb || !gb.product) notFound()

  const p = gb.product
  const stores = await getActiveStores()
  const participating = gb.store_ids?.length
    ? stores.filter((s) => gb.store_ids.includes(s.id))
    : stores
  const remaining = remainingQty(gb.total_qty, gb.ordered_qty)
  const closed = isClosed(gb.sale_end) || (remaining !== null && remaining <= 0)

  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex gap-3 py-1.5 text-sm">
        <span className="w-24 shrink-0 text-gray-500">{label}</span>
        <span className="flex-1">{value}</span>
      </div>
    ) : null

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-28">
      <div className="-mx-4 mb-4 flex aspect-square items-center justify-center bg-gray-100 text-gray-400">
        {p.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
        ) : (
          <span>이미지 준비중</span>
        )}
      </div>

      <Link href="/" className="text-sm text-emerald-600">← 목록으로</Link>

      <h1 className="mt-2 text-xl font-bold">{p.name}</h1>
      <div className="mt-2 flex items-baseline gap-2">
        {p.normal_price && (
          <span className="text-gray-400 line-through">{formatPrice(p.normal_price)}</span>
        )}
        <span className="text-2xl font-bold text-emerald-600">{formatPrice(p.group_price)}</span>
      </div>

      <section className="mt-5 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">상품 정보</h2>
        <Row label="구성" value={p.composition} />
        <Row label="보관방법" value={p.storage} />
        <Row label="유통기한" value={p.expiry} />
        <Row label="원산지" value={p.origin} />
        <Row label="알레르기" value={p.allergy} />
        {p.description && <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{p.description}</p>}
      </section>

      <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="mb-2 font-semibold">픽업 안내</h2>
        <Row label="픽업 가능일" value={formatDate(gb.pickup_date)} />
        <Row label="주문 마감" value={formatDate(gb.sale_end)} />
        {remaining !== null && <Row label="남은 수량" value={`${remaining}개`} />}
        <Row label="최대 주문" value={`1인 ${p.max_per_person}개`} />
        <Row
          label="픽업 매장"
          value={participating.map((s) => s.name).join(", ") || "준비중"}
        />
      </section>

      <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="whitespace-pre-line">{COPY.beforeOrder}</p>
        <p className="mt-2 whitespace-pre-line">{COPY.payAtStore}</p>
        <p className="mt-2">냉장·냉동 상품은 픽업 당일 수령을 권장합니다.</p>
      </section>

      {/* 하단 고정 CTA */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white p-3">
        <div className="mx-auto max-w-screen-md">
          {closed ? (
            <button disabled className="w-full cursor-not-allowed rounded-xl bg-gray-200 py-3.5 font-semibold text-gray-500">
              마감되었습니다
            </button>
          ) : (
            <Link
              href={`/order/${gb.id}`}
              className="block w-full rounded-xl bg-emerald-600 py-3.5 text-center font-semibold text-white hover:bg-emerald-700"
            >
              예약 주문하기
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}
