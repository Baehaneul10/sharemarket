"use client"

import { useState } from "react"
import { bulkMarkIncomingAction, bulkPickupCompleteAction } from "@/app/owner/actions"
import { StatusBadge } from "@/components/StatusBadge"
import { formatPrice } from "@/lib/format"
import type { OrderStatus } from "@/types/db"

type Row = {
  id: string
  order_no: string
  customer_name: string
  product_name: string
  quantity: number
  total_price: number
  status: OrderStatus
  phone: string | null
}

export function PickupChecklist({ orders }: { orders: Row[] }) {
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
    return <p className="rounded-xl border border-gray-100 bg-white py-12 text-center text-sm text-gray-500">오늘 픽업할 주문이 없습니다.</p>
  }

  return (
    <form>
      <div className="mb-3 flex items-center justify-between print:hidden">
        <button type="button" onClick={toggleAll} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
          {allChecked ? "전체 해제" : "전체 선택"}
        </button>
        <button type="button" onClick={() => window.print()} className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50">
          🖨 인쇄
        </button>
      </div>

      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <input
              type="checkbox"
              name="order_ids"
              value={o.id}
              checked={sel.has(o.id)}
              onChange={() => toggle(o.id)}
              className="h-5 w-5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{o.customer_name}</span>
                <StatusBadge status={o.status} />
              </div>
              <p className="text-sm text-gray-600">{o.product_name} · {o.quantity}개 · {formatPrice(o.total_price)}</p>
              <p className="text-xs text-gray-400">{o.order_no}{o.phone ? ` · ${o.phone}` : ""}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="sticky bottom-0 mt-3 flex gap-2 border-t border-gray-200 bg-gray-50 py-3 print:hidden">
        <button formAction={bulkMarkIncomingAction} className="flex-1 rounded-xl border border-blue-300 py-3 font-semibold text-blue-700 hover:bg-blue-50">
          선택 입고완료
        </button>
        <button formAction={bulkPickupCompleteAction} className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
          선택 픽업완료
        </button>
      </div>
    </form>
  )
}
