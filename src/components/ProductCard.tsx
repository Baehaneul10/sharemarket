import Link from "next/link"
import type { GroupBuyWithProduct } from "@/types/db"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"

export function ProductCard({ gb }: { gb: GroupBuyWithProduct }) {
  const p = gb.product
  const remaining = remainingQty(gb.total_qty, gb.ordered_qty)
  const closed = isClosed(gb.sale_end) || (remaining !== null && remaining <= 0)

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <Link href={`/products/${p.id}`} className="block">
        <div className="flex aspect-[4/3] items-center justify-center bg-gray-100 text-gray-400">
          {p.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm">이미지 준비중</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {p.category && (
          <span className="w-fit rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
            {p.category}
          </span>
        )}
        <Link href={`/products/${p.id}`} className="line-clamp-2 font-semibold leading-snug">
          {p.name}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          {p.normal_price && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(p.normal_price)}</span>
          )}
          <span className="text-lg font-bold text-emerald-600">{formatPrice(p.group_price)}</span>
        </div>

        <div className="mt-1 space-y-0.5 text-xs text-gray-500">
          <p>픽업일: {formatDate(gb.pickup_date)}</p>
          <p>마감: {formatDate(gb.sale_end)}</p>
          {remaining !== null && <p>남은 수량: {remaining}개</p>}
        </div>

        {closed ? (
          <button
            disabled
            className="mt-2 w-full cursor-not-allowed rounded-xl bg-gray-200 py-2.5 text-sm font-semibold text-gray-500"
          >
            마감되었습니다
          </button>
        ) : (
          <Link
            href={`/order/${gb.id}`}
            className="mt-2 w-full rounded-xl bg-emerald-600 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
          >
            예약 주문하기
          </Link>
        )}
      </div>
    </div>
  )
}
