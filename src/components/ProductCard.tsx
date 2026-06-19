import Link from "next/link"
import type { CatalogItem } from "@/lib/queries"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"

export function ProductCard({ item }: { item: CatalogItem }) {
  const p = item.product
  const gb = item.groupBuy
  const remaining = gb ? remainingQty(gb.total_qty, gb.ordered_qty) : null
  const soldOut = remaining !== null && remaining <= 0
  const closed = gb ? isClosed(gb.sale_end) || soldOut : false

  const discount =
    p.normal_price && p.normal_price > 0
      ? Math.round(((p.normal_price - p.group_price) / p.normal_price) * 100)
      : null

  const orderHref = gb ? `/order/${gb.id}` : `/order/p/${p.id}`

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
      <Link href={`/products/${p.id}`} className="relative block">
        <div className="flex aspect-[4/3] items-center justify-center bg-sky-50 text-sky-300">
          {p.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">이미지 준비중</span>
          )}
        </div>
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="text-xl font-extrabold tracking-wide text-white">SOLD OUT</span>
          </div>
        )}
        {gb && !soldOut && (
          <span className="absolute left-2 top-2 rounded bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
            공구특가
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {p.category && (
          <span className="w-fit rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-700">{p.category}</span>
        )}
        <Link href={`/products/${p.id}`} className="line-clamp-2 font-semibold leading-snug text-gray-800">
          {p.name}
        </Link>

        <div className="mt-1">
          {p.normal_price && (
            <span className="mr-1.5 text-sm text-gray-400 line-through">{formatPrice(p.normal_price)}</span>
          )}
          <div className="flex items-baseline gap-1.5">
            {discount !== null && discount > 0 && (
              <span className="text-lg font-extrabold text-red-500">{discount}%</span>
            )}
            <span className="text-lg font-extrabold text-blue-800">{formatPrice(p.group_price)}</span>
          </div>
        </div>

        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
          {gb ? (
            <>
              <p>픽업일: {formatDate(gb.pickup_date)}</p>
              <p>마감: {formatDate(gb.sale_end)}</p>
              {remaining !== null && <p>남은 수량: {remaining}개</p>}
            </>
          ) : (
            <p>주문하면 2일 뒤 매장 픽업</p>
          )}
        </div>

        {closed ? (
          <button disabled className="mt-2 w-full cursor-not-allowed rounded-xl bg-gray-200 py-2.5 text-sm font-semibold text-gray-500">
            {soldOut ? "품절" : "마감되었습니다"}
          </button>
        ) : (
          <Link
            href={orderHref}
            className="mt-2 w-full rounded-xl bg-sky-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-sky-600"
          >
            예약 주문하기
          </Link>
        )}
      </div>
    </div>
  )
}
