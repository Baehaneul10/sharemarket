"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { formatPrice, formatDate, remainingQty, isClosed } from "@/lib/format"
import { createClient } from "@/lib/supabase/client"
import { createBatchOrderAction, type BatchOrderItem } from "@/app/order/actions"
import type { CatalogItem } from "@/lib/queries"

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-1">
      <span className="w-20 shrink-0 text-gray-500">{label}</span>
      <span className="flex-1">{value}</span>
    </div>
  )
}

// 지구스토어식: 1줄 1상품 + 수량 스테퍼 + 하단 "예약하기"로 여러 건 한 번에 예약
// - 상품 클릭 시 새 페이지가 아니라 모달(팝업)로 상세 (추가 서버 호출 없음)
// - 남은 수량/SOLD OUT 표시 + 다른 손님이 예약하면 실시간 반영
export function StoreCatalogList({ storeId, items }: { storeId: string; items: CatalogItem[] }) {
  const router = useRouter()
  const cartKey = `yy_cart_${storeId}`
  const [qty, setQty] = useState<Record<string, number>>({})
  const [pending, setPending] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [detail, setDetail] = useState<CatalogItem | null>(null)
  const [done, setDone] = useState(false)
  // 실시간 주문 누적량 (productId → ordered_qty). 다른 손님 주문 시 갱신.
  const [liveOrdered, setLiveOrdered] = useState<Record<string, number>>({})

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

  // 모달 열렸을 때 ESC로 닫기
  useEffect(() => {
    if (!detail) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDetail(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [detail])

  // 실시간: products 테이블 변경 구독 → 남은 수량 즉시 반영
  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null
    const setup = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`catalog-products-${storeId}`)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "products" },
          (payload) => {
            const np = payload.new as { id?: string; ordered_qty?: number }
            if (np?.id != null) {
              setLiveOrdered((prev) => ({ ...prev, [np.id as string]: np.ordered_qty ?? 0 }))
            }
          })
        .subscribe()
    }
    void setup()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [storeId])

  // 남은 수량 (공구: total_qty 기준 / 상품: stock 기준, 실시간 누적 반영). null = 무제한
  const remainingOf = (it: CatalogItem): number | null => {
    if (it.groupBuy) return remainingQty(it.groupBuy.total_qty, it.groupBuy.ordered_qty)
    const ordered = liveOrdered[it.product.id] ?? it.product.ordered_qty ?? 0
    return remainingQty(it.product.stock, ordered)
  }
  const maxOf = (it: CatalogItem) => {
    const r = remainingOf(it)
    return r !== null ? Math.min(it.product.max_per_person, r) : it.product.max_per_person
  }
  const closedOf = (it: CatalogItem) => {
    const r = remainingOf(it)
    const soldOut = r !== null && r <= 0
    if (it.groupBuy) return isClosed(it.groupBuy.sale_end) || soldOut
    return soldOut
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
      setQty({})        // 스테퍼 0으로 초기화
      setPending(false)
      setDone(true)     // 페이지 이동 없이 완료 알럿만 표시
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
          const remaining = remainingOf(it)
          const soldOut = remaining !== null && remaining <= 0
          const closed = closedOf(it)
          const max = maxOf(it)
          const count = qty[p.id] ?? 0
          const discount =
            p.normal_price && p.normal_price > 0
              ? Math.round(((p.normal_price - p.group_price) / p.normal_price) * 100)
              : null

          return (
            <li key={p.id} className="flex gap-3 rounded-2xl border border-sky-100 bg-white p-3 shadow-sm">
              <button
                type="button"
                onClick={() => setDetail(it)}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-sky-50 text-left"
              >
                {p.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumbnail_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xs text-sky-300">이미지 준비중</span>
                )}
                {gb && !soldOut && <span className="absolute left-1 top-1 rounded bg-red-500 px-1 py-0.5 text-[10px] font-bold text-white">공구특가</span>}
                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="text-xs font-extrabold tracking-wide text-white">SOLD OUT</span>
                  </div>
                )}
              </button>

              <div className="flex min-w-0 flex-1 flex-col">
                {p.category && <span className="w-fit rounded bg-sky-100 px-1.5 py-0.5 text-[11px] text-sky-700">{p.category}</span>}
                <button
                  type="button"
                  onClick={() => setDetail(it)}
                  className="mt-0.5 line-clamp-2 text-left font-semibold leading-snug text-gray-800"
                >
                  {p.name}
                </button>

                <div className="mt-0.5 flex items-baseline gap-1.5">
                  {p.normal_price && <span className="text-xs text-gray-400 line-through">{formatPrice(p.normal_price)}</span>}
                  {discount !== null && discount > 0 && <span className="text-sm font-extrabold text-red-500">{discount}%</span>}
                  <span className="text-base font-extrabold text-blue-800">{formatPrice(p.group_price)}</span>
                </div>

                {gb && (
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    픽업 {formatDate(gb.pickup_date)} · 마감 {formatDate(gb.sale_end)}
                  </p>
                )}
                {remaining !== null && !soldOut && (
                  <p className="mt-0.5 text-[11px] font-bold text-orange-600">남은 {remaining}개</p>
                )}

                {/* 수량 스테퍼 / 마감·품절 */}
                <div className="mt-2">
                  {closed ? (
                    <span className="inline-block rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500">
                      {soldOut ? "품절" : "마감"}
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

      {/* 상품 상세 모달 (페이지 이동 없이 팝업) */}
      {detail && (() => {
        const dp = detail.product
        const dgb = detail.groupBuy
        const dRemaining = remainingOf(detail)
        const dSoldOut = dRemaining !== null && dRemaining <= 0
        const dClosed = closedOf(detail)
        const dMax = maxOf(detail)
        const dCount = qty[dp.id] ?? 0
        const dDiscount =
          dp.normal_price && dp.normal_price > 0
            ? Math.round(((dp.normal_price - dp.group_price) / dp.normal_price) * 100)
            : null

        return (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
            onClick={() => setDetail(null)}
          >
            <div
              className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <p className="line-clamp-1 pr-2 font-bold">{dp.name}</p>
                <button type="button" onClick={() => setDetail(null)} aria-label="닫기" className="text-xl leading-none text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {/* 스크롤 본문 */}
              <div className="flex-1 overflow-y-auto">
                <div className="relative flex aspect-square items-center justify-center bg-sky-50">
                  {dp.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={dp.thumbnail_url} alt={dp.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sky-300">이미지 준비중</span>
                  )}
                  {dSoldOut && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-xl font-extrabold tracking-wide text-white">SOLD OUT</span>
                    </div>
                  )}
                </div>

                <div className="px-4 py-3">
                  {dp.category && <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[11px] text-sky-700">{dp.category}</span>}
                  <div className="mt-1.5 flex items-baseline gap-2">
                    {dp.normal_price && <span className="text-sm text-gray-400 line-through">{formatPrice(dp.normal_price)}</span>}
                    {dDiscount !== null && dDiscount > 0 && <span className="text-base font-extrabold text-red-500">{dDiscount}%</span>}
                    <span className="text-xl font-extrabold text-blue-800">{formatPrice(dp.group_price)}</span>
                  </div>
                  {dgb && (
                    <p className="mt-1 text-xs text-gray-500">
                      픽업 {formatDate(dgb.pickup_date)} · 마감 {formatDate(dgb.sale_end)}
                    </p>
                  )}
                  {dRemaining !== null && !dSoldOut && (
                    <p className="mt-1 text-sm font-bold text-orange-600">남은 {dRemaining}개</p>
                  )}
                </div>

                {/* 상품 정보 */}
                <div className="border-t border-gray-100 px-4 py-3 text-sm">
                  <InfoRow label="구성" value={dp.composition} />
                  <InfoRow label="보관방법" value={dp.storage} />
                  <InfoRow label="유통기한" value={dp.expiry} />
                  <InfoRow label="원산지" value={dp.origin} />
                  <InfoRow label="알레르기" value={dp.allergy} />
                  {dp.description && <p className="mt-2 whitespace-pre-line text-gray-700">{dp.description}</p>}
                </div>

                {/* 상세 이미지 */}
                {dp.images && dp.images.length > 0 && (
                  <div className="border-t border-gray-100">
                    {dp.images.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt="" className="w-full" />
                    ))}
                  </div>
                )}
              </div>

              {/* 하단 담기 */}
              <div className="border-t border-gray-100 p-3">
                {dClosed ? (
                  <div className="w-full rounded-xl bg-gray-200 py-3 text-center font-semibold text-gray-500">
                    {dSoldOut ? "품절" : "마감되었습니다"}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button type="button" onClick={() => setItemQty(dp.id, dCount - 1, dMax)} disabled={dCount <= 0} className="px-3 py-2 text-lg leading-none text-gray-600 disabled:text-gray-300" aria-label="수량 감소">−</button>
                      <span className="w-10 text-center font-semibold">{dCount}</span>
                      <button type="button" onClick={() => setItemQty(dp.id, dCount + 1, dMax)} disabled={dCount >= dMax} className="px-3 py-2 text-lg leading-none text-gray-600 disabled:text-gray-300" aria-label="수량 증가">+</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => { if ((qty[dp.id] ?? 0) === 0) setItemQty(dp.id, 1, dMax); setDetail(null) }}
                      className="flex-1 rounded-xl bg-sky-500 py-3 font-semibold text-white hover:bg-sky-600"
                    >
                      {dCount > 0 ? "담기 완료" : "담기"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* 예약 완료 알럿 (페이지 이동 없이 가운데 팝업) */}
      {done && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="text-3xl">✅</div>
            <p className="mt-2 text-lg font-bold text-gray-900">예약이 완료되었습니다</p>
            <p className="mt-1 text-sm text-gray-500">마이페이지에서 확인할 수 있어요.</p>
            <button
              type="button"
              onClick={() => { setDone(false); router.refresh() }}
              className="mt-5 w-full rounded-xl bg-sky-500 py-3 font-semibold text-white hover:bg-sky-600"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  )
}
