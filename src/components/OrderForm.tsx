"use client"

import { useActionState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { CreateOrderResult } from "@/app/order/actions"

type OrderAction = (
  prev: CreateOrderResult | null,
  formData: FormData
) => Promise<CreateOrderResult>

export function OrderForm({
  action,
  fieldName,
  fieldValue,
  maxPerPerson,
  remaining,
}: {
  action: OrderAction
  fieldName: string   // "group_buy_id" 또는 "product_id"
  fieldValue: string
  maxPerPerson: number
  remaining: number | null
}) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState<CreateOrderResult | null, FormData>(action, null)
  const maxQty = remaining !== null ? Math.min(maxPerPerson, remaining) : maxPerPerson

  useEffect(() => {
    if (state?.ok) router.push(`/order/complete?no=${state.orderNo}`)
  }, [state, router])

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name={fieldName} value={fieldValue} />

      <div className="rounded-2xl border border-sky-100 bg-white p-4">
        <label className="mb-1.5 block text-sm font-medium">수량</label>
        <input
          name="quantity" type="number" required min={1} max={maxQty} defaultValue={1}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5"
        />
        <p className="mt-1 text-xs text-gray-500">1인 최대 {maxPerPerson}개까지 주문 가능합니다.</p>
      </div>

      <p className="px-1 text-xs text-gray-400">
        주문자 정보(이름·연락처)는 카카오 로그인 정보로 자동 처리됩니다. 결제는 매장 방문 시 진행됩니다.
      </p>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-sky-500 py-3.5 font-semibold text-white hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {pending ? "처리 중..." : "예약 주문하기"}
      </button>
    </form>
  )
}
