import Link from "next/link"
import { notFound } from "next/navigation"
import { requireOwner } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { OwnerHeader } from "@/components/OwnerHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { CopyButton } from "@/components/CopyButton"
import { formatPrice, formatDate, formatDateTime } from "@/lib/format"
import { buildNoticeText } from "@/lib/notice"
import { NO_SHOW_REASONS } from "@/lib/constants"
import {
  markIncomingAction, pickupCompleteAction, cancelOrderAction, noShowAction,
} from "@/app/owner/actions"
import type { Order, GroupBuyWithProduct } from "@/types/db"

export default async function OwnerOrderDetail(props: {
  params: Promise<{ id: string }>
}) {
  const store = await requireOwner()
  const { id } = await props.params
  const supabase = await createClient()

  const { data: orderData } = await supabase.from("orders").select("*").eq("id", id).maybeSingle()
  const order = orderData as Order | null
  if (!order) notFound()

  const { data: gbData } = await supabase
    .from("group_buys").select("*, product:products(*)").eq("id", order.group_buy_id).maybeSingle()
  const gb = gbData as unknown as GroupBuyWithProduct | null

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const noticeText = gb?.product
    ? buildNoticeText({ product: gb.product, groupBuy: gb, store, orderUrl: `${siteUrl}/order/${gb.id}` })
    : ""

  const active = order.status === "received" || order.status === "incoming"

  return (
    <>
      <OwnerHeader storeName={store.name} />
      <main className="mx-auto w-full max-w-screen-md flex-1 px-4 py-6">
        <Link href="/owner/orders" className="text-sm text-emerald-600">← 주문 목록</Link>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-gray-400">{order.order_no}</span>
          <StatusBadge status={order.status} />
        </div>

        {/* 주문 정보 */}
        <section className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 text-sm">
          <Row label="고객명" value={order.customer_name} />
          <Row label="상품" value={`${order.product_name} · ${order.quantity}개`} />
          <Row label="결제 예정액" value={formatPrice(order.total_price)} />
          <Row label="픽업 예정일" value={formatDate(order.pickup_date)} />
          <Row label="주문 접수" value={formatDateTime(order.created_at)} />
          {order.request_note && <Row label="요청사항" value={order.request_note} />}
          {order.cancel_reason && <Row label="취소 사유" value={order.cancel_reason} />}
          {order.no_show_reason && <Row label="미수령 사유" value={order.no_show_reason} />}
          {order.picked_up_at && <Row label="픽업 완료" value={formatDateTime(order.picked_up_at)} />}
        </section>

        {/* 연락 버튼 */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={`tel:${order.phone}`} className="rounded-xl border border-gray-300 bg-white py-3 text-center font-medium hover:bg-gray-50">📞 전화하기</a>
          <a href={`sms:${order.phone}`} className="rounded-xl border border-gray-300 bg-white py-3 text-center font-medium hover:bg-gray-50">✉️ 문자 보내기</a>
        </div>

        {/* 상태 변경 */}
        {active && (
          <section className="mt-4 space-y-3">
            {order.status === "received" && (
              <form action={markIncomingAction}>
                <input type="hidden" name="order_id" value={order.id} />
                <button className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">입고 완료 처리</button>
              </form>
            )}

            {/* 픽업 완료 */}
            <form action={pickupCompleteAction} className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <input type="hidden" name="order_id" value={order.id} />
              <p className="font-semibold text-emerald-800">픽업 완료 처리</p>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="paid" defaultChecked className="h-4 w-4" /> 현장 결제 완료
              </label>
              <div className="flex items-center gap-2 text-sm">
                <span>실제 수령 수량</span>
                <input type="number" name="received_qty" min={0} defaultValue={order.quantity} className="w-20 rounded-lg border border-gray-300 px-2 py-1.5" />
              </div>
              <input name="memo" placeholder="메모 (선택)" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <button className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700">픽업 완료</button>
            </form>

            {/* 미수령 */}
            <form action={noShowAction} className="space-y-2 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <input type="hidden" name="order_id" value={order.id} />
              <p className="font-semibold text-orange-800">미수령 처리</p>
              <select name="no_show_reason" defaultValue={NO_SHOW_REASONS[0]} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                {NO_SHOW_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <button className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white hover:bg-orange-600">미수령 처리</button>
            </form>

            {/* 취소 */}
            <form action={cancelOrderAction} className="space-y-2 rounded-2xl border border-gray-200 bg-white p-4">
              <input type="hidden" name="order_id" value={order.id} />
              <p className="font-semibold text-gray-700">취소 처리</p>
              <input name="cancel_reason" placeholder="취소 사유 (선택)" className="w-full rounded-lg border border-gray-300 px-3 py-2" />
              <button className="w-full rounded-xl border border-red-300 py-3 font-semibold text-red-600 hover:bg-red-50">주문 취소</button>
            </form>
          </section>
        )}

        {/* 공지문 복사 */}
        {noticeText && (
          <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">공지문</p>
              <CopyButton text={noticeText} label="공지문 복사하기" />
            </div>
            <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{noticeText}</pre>
          </section>
        )}
      </main>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-1.5">
      <span className="w-24 shrink-0 text-gray-500">{label}</span>
      <span className="flex-1 font-medium">{value}</span>
    </div>
  )
}
