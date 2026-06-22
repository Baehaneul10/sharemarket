"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { formatPrice, formatDate, formatDateTime } from "@/lib/format"
import { updateMyOrderQtyAction, cancelMyOrderAction } from "@/app/order/actions"
import { StatusBadge } from "@/components/StatusBadge"
import type { OrderStatus } from "@/types/db"

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="shrink-0 text-sm font-semibold text-gray-500">{label}</span>
      <div className="text-right text-sm font-medium text-gray-800">{children}</div>
    </div>
  )
}

export function MyOrderCard(props: {
  orderId: string
  orderNo: string
  productId: string
  status: OrderStatus
  storeName: string
  storeAddress: string | null
  productName: string
  unitPrice: number
  quantity: number
  pickupDate: string | null
  saleEnd: string | null
  editable: boolean
}) {
  const {
    orderId, orderNo, productId, status, storeName, storeAddress,
    productName, unitPrice, quantity, pickupDate, saleEnd, editable,
  } = props
  const [qty, setQty] = useState(quantity)

  return (
    <li className="rounded-2xl border-2 border-sky-200 bg-white p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-gray-400">{orderNo}</span>
        <StatusBadge status={status} />
      </div>

      <div className="divide-y divide-gray-100">
        <Row label="점포명">{storeName}</Row>
        <Row label="상품명">
          <Link href={`/products/${productId}`} className="text-blue-700 underline-offset-2 hover:underline">
            {productName}
          </Link>
        </Row>
        <Row label="상품단가">{formatPrice(unitPrice)}</Row>
        <Row label="주문수량">
          {editable ? (
            <div className="inline-flex items-center rounded-lg border border-gray-300">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                className="px-3 py-1.5 text-lg leading-none text-gray-600 disabled:text-gray-300"
                aria-label="수량 감소"
              >−</button>
              <span className="w-10 text-center text-sm font-semibold">{qty}개</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="px-3 py-1.5 text-lg leading-none text-gray-600"
                aria-label="수량 증가"
              >+</button>
            </div>
          ) : (
            `${qty}개`
          )}
        </Row>
        <Row label="주문금액">
          <span className="font-bold text-blue-800">{formatPrice(unitPrice * qty)}</span>
        </Row>
        {storeAddress && <Row label="픽업장소">{storeAddress}</Row>}
        <Row label="픽업가능일시">
          {saleEnd ? `${formatDateTime(saleEnd)} 마감` : pickupDate ? `${formatDate(pickupDate)} 픽업` : "-"}
        </Row>
      </div>

      {editable && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <form action={updateMyOrderQtyAction}>
            <input type="hidden" name="order_id" value={orderId} />
            <input type="hidden" name="quantity" value={qty} />
            <button className="w-full rounded-xl bg-sky-500 py-2.5 font-semibold text-white hover:bg-sky-600">
              수량 적용
            </button>
          </form>
          <form action={cancelMyOrderAction}>
            <input type="hidden" name="order_id" value={orderId} />
            <button className="w-full rounded-xl border border-red-300 py-2.5 font-semibold text-red-600 hover:bg-red-50">
              예약 취소
            </button>
          </form>
        </div>
      )}
    </li>
  )
}
