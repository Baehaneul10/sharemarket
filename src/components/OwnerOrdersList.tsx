"use client"

import { useState } from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/StatusBadge"
import { phoneLast4, formatDate } from "@/lib/format"
import { bulkMarkIncomingAction, bulkPickupCompleteAction, bulkCancelAction } from "@/app/owner/actions"
import type { OrderStatus } from "@/types/db"

type Row = {
  id: string
  order_no: string
  status: OrderStatus
  product_name: string
  quantity: number
  customer_name: string
  phone: string | null
  pickup_date: string | null
  hasNote: boolean
}

export function OwnerOrdersList({ orders }: { orders: Row[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set())
  const allChecked = orders.length > 0 && sel.size === orders.length

  const toggle = (id: string) =>
    setSel((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id); else n.add(id)
      return n
    })
  const toggleAll = () => setSel(allChecked ? new Set() : new Set(orders.map((o) => o.id)))

  if (orders.length === 0) {
    return <p className="py-16 text-center text-sm text-gray-500">주문이 없습니다.</p>
  }

  return (
    <form>
      <div className="mt-3 flex items-center justify-between">
        <button type="button" onClick={toggleAll} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
          {allChecked ? "전체 해제" : "전체 선택"}
        </button>
        <span className="text-sm text-gray-500">{sel.size}건 선택</span>
      </div>

      <ul className="mt-3 space-y-2 pb-24">
        {orders.map((o) => (
          <li key={o.id} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <input
              type="checkbox"
              name="order_ids"
              value={o.id}
              checked={sel.has(o.id)}
              onChange={() => toggle(o.id)}
              className="mt-1 h-5 w-5 shrink-0"
            />
            <Link href={`/owner/orders/${o.id}`} prefetch={false} className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{o.order_no}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="mt-1 font-semibold">{o.product_name} · {o.quantity}개</p>
              <p className="mt-0.5 text-sm text-gray-500">
                {o.customer_name} ({phoneLast4(o.phone)}) · 픽업 {formatDate(o.pickup_date)}
                {o.hasNote ? " · 📝요청사항" : ""}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {sel.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white p-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          <div className="mx-auto flex w-full max-w-screen-md gap-2">
            <button formAction={bulkMarkIncomingAction} className="flex-1 rounded-xl border border-blue-300 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              입고완료
            </button>
            <button formAction={bulkPickupCompleteAction} className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700">
              픽업완료
            </button>
            <button
              formAction={bulkCancelAction}
              onClick={(e) => { if (!confirm(`선택한 ${sel.size}건을 취소할까요?`)) e.preventDefault() }}
              className="flex-1 rounded-xl border border-red-300 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
