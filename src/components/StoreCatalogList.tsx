"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"
import { createBatchOrderAction, type BatchOrderItem } from "@/app/order/actions"
import type { CatalogItem } from "@/lib/queries"

// 지구스토어식: 1줄 1상품 + 수량 스테퍼 + 하단 "예약하기"로 여러 건 한 번에 예약
export function StoreCatalogList({ storeId, items }: { storeId: string; items: CatalogItem[] }) {
  const router = useRouter()
  const cartKey = `yy_cart_${storeId}`
  const [qty, setQty] = useState<Record<string, number>>({})
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // 장바구니 수량을 sessionStorage에 보관 (카테고리 이동/새로고침에도 유지)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(cartKey)
      if (saved) setQty(JSON.parse(saved))
    } catch { /* 무시 */ }
  }, [cartKey])

  useEffect(() => {
    try { sessionStorage.setItem(cartKey, JSON.stringify(qty)) } catch { /* 무시 */ }
  }, [cartKey, qty])

  const maxOf = (it: CatalogItem) => {
    const max = it.product.max_per_person
    if (!it.groupBuy) return max
    const r = remainingQty(it.groupBuy.total_qty, it.groupBuy.ordered_qty)
    return r !== null ? Math.min(max, r) : max
  }
  const closedOf = (it: CatalogItem) => {
    if (!it.groupBuy) return false
    const r = remainingQty(it.groupBuy.total_qty, it.groupBuy.ordered_qty)
    return isClosed(it.groupBuy.sale_end) || (r !== null && r <= 0)
  }

  const setItemQty = (id: string, next: number, max: number) => {
    const v = Math.max(0, Math.min(next, max))
    setQty((prev) => {
      const copy = { ...prev }
      if (v <= 0) delete copy[id]
      else copy[id] = v
      return copy
    })
  }

  // 합계
  const totalQty = items.reduce((s, it) => s + (qty[it.product.id] ?? 0), 0)
  const totalPrice = items.reduce((s, it) => s + (qty[it.product.id] ?? 0) * it.product.group_price, 0)

  async function submit() {
    const payload: BatchOrderItem[] = items
      .filter((it) => (qty[it.product.id] ?? 0) > 0)
      .map((it) => ({
        kind: it.groupBuy ? "gb" : "product",
        id: it.groupBuy ? it.groupBuy.id : it.product.id,
        quantity: qty[it.product.id],
      }))
    if (payload.length === 0) return
    setPending(true); setErr(null)
    const res = await createBatchOrderAction(payload)
    if (res.ok) {
      try { sessionStorage.removeItem(cartKey) } catch { /* 무시 */ }
      router.push(`/order/complete?nos=${res.orderNos.join(",")}`)
    } else {
      setErr(res.error); setPending(false)
    }
  }

  if (items.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-500">판매 중인 상품이 없습니다.</p>
  }

  return (
    <>
      <ul className="space-y-3">
        {items.map((it) => {
          const p = it.product
          const gb = it.groupBuy
          const remaining = gb ? remainingQty(gb.total_qty, gb.ordered_qty) : null
          const closed = closedOf(it)
          const max = maxOf(it)
          const count = qty[p.id] ?? 0
          const discount =
            p.normal_price && p.normal_price > 0
              ? Math.round(((p.normal_price - p.group_price) / p.normal_price) * 100)
              : null

          return (
            <li key={p.id} className="flex gap-3 rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
              <Link href={`/products/${p.id}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sky-50">
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-sky-300">이미지 준비중</span>
                )}
                {gb && <span className="absolute left-1 top-1 rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">공구특가</span>}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                {p.category && <span className="w-fit rounded bg-sky-100 px-1.5 py-0.5 text-[11px] text-sky-700">{p.category}</span>}
                <Link href={`/products/${p.id}`} className="mt-0.5 line-clamp-2 font-semibold leading-snug text-gray-800">
                  {p.name}
                </Link>

                <div className="mt-0.5 flex items-baseline gap-1.5">
                  {p.normal_price && <span className="text-xs text-gray-400 line-through">{formatPrice(p.normal_price)}</span>}
                  {discount !== null && discount > 0 && <span className="text-sm font-extrabold text-red-500">{discount}%</span>}
                  <span className="text-base font-extrabold text-blue-800">{formatPrice(p.group_price)}</span>
                </div>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  {gb
                    ? `픽업 ${formatDate(gb.pickup_date)} · 마감 ${formatDate(gb.sale_end)}${remaining !== null ? ` · 남은 ${remaining}개` : ""}`
                    : "주문하면 2일 뒤 매장 픽업"}
                </p>

                {/* 수량 스테퍼 / 마감 */}
                <div className="mt-2">
                  {closed ? (
                    <span className="inline-block rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                      {remaining !== null && remaining <= 0 ? "품절" : "마감"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-gray-300">
                        <button
                          type="button"
                          onClick={() => setItemQty(p.id, count - 1, max)}
                          className="px-3 py-1.5 text-lg leading-none text-gray-600 disabled:text-gray-300"
                          disabled={count <= 0}
                          aria-label="수량 감소"
                        >−</button>
                        <span className="w-8 text-center text-sm font-semibold">{count}</span>
                        <button
                          type="button"
                          onClick={() => setItemQty(p.id, count + 1, max)}
                          className="px-3 py-1.5 text-lg leading-none text-gray-600 disabled:text-gray-300"
                          disabled={count >= max}
                          aria-label="수량 증가"
                        >+</button>
                      </div>
                      {count > 0 && (
                        <span className="text-sm font-semibold text-blue-800">{formatPrice(p.group_price * count)}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* 하단 고정 예약 바 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto w-full max-w-screen-md">
          {err && <p className="mb-2 rounded-lg bg-red-50 p-2 text-center text-xs text-red-700">{err}</p>}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500">선택 {totalQty}개</p>
              <p className="text-lg font-extrabold text-gray-900">{formatPrice(totalPrice)}</p>
            </div>
            <button
              type="button"
              onClick={submit}
              disabled={totalQty === 0 || pending}
              className="rounded-xl bg-sky-500 px-8 py-3.5 font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {pending ? "처리 중..." : "예약하기"}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
