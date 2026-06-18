"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createOrderAction, type CreateOrderResult } from "../actions"
import { COPY } from "@/lib/constants"

type StoreOption = { id: string; name: string; pickup_hours: string | null }

export function OrderForm({
  groupBuyId,
  maxPerPerson,
  remaining,
  stores,
}: {
  groupBuyId: string
  maxPerPerson: number
  remaining: number | null
  stores: StoreOption[]
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<CreateOrderResult | null, FormData>(
    createOrderAction,
    null
  )

  const maxQty = remaining !== null ? Math.min(maxPerPerson, remaining) : maxPerPerson

  useEffect(() => {
    if (state?.ok) {
      router.push(`/order/complete?no=${state.orderNo}&p=${state.last4}`)
    }
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="group_buy_id" value={groupBuyId} />

      {/* 픽업 매장 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="mb-1.5 block text-sm font-medium">픽업 매장 *</label>
        {stores.length === 0 ? (
          <p className="text-sm text-gray-500">참여 매장이 없습니다.</p>
        ) : (
          <select name="store_id" required defaultValue="" className="w-full rounded-lg border border-gray-300 px-3 py-2.5">
            <option value="" disabled>매장을 선택하세요</option>
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.pickup_hours ? ` / ${s.pickup_hours}` : ""}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 고객 정보 */}
      <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">고객명 *</label>
          <input name="customer_name" required placeholder="이름" className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">휴대폰 번호 *</label>
          <input name="phone" required inputMode="numeric" placeholder="010-0000-0000" className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">수량 *</label>
          <input
            name="quantity" type="number" required min={1} max={maxQty} defaultValue={1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
          />
          <p className="mt-1 text-xs text-gray-500">1인 최대 {maxPerPerson}개까지 주문 가능합니다.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">요청사항</label>
          <textarea name="request_note" rows={2} placeholder="예) 퇴근 후 7시쯤 방문할게요." className="w-full rounded-lg border border-gray-300 px-3 py-2.5" />
          <p className="mt-1 text-xs text-gray-500">{COPY.requestNote}</p>
        </div>
      </div>

      {/* 개인정보 동의 */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="privacy_agreed" required className="mt-0.5 h-4 w-4" />
          <span className="whitespace-pre-line text-gray-700">{COPY.privacy}</span>
        </label>
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || stores.length === 0}
        className="w-full rounded-xl bg-emerald-600 py-3.5 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? "처리 중..." : "주문 접수하기"}
      </button>
    </form>
  )
}
