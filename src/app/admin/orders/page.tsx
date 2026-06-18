import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminHeader } from "@/components/AdminHeader"
import { StatusBadge } from "@/components/StatusBadge"
import { formatPrice, formatDate, maskPhone } from "@/lib/format"
import { ORDER_STATUS } from "@/lib/constants"
import type { Order, Store, GroupBuyWithProduct } from "@/types/db"

export default async function AdminOrdersPage(props: {
  searchParams: Promise<{ status?: string }>
}) {
  await requireAdmin()
  const { status } = await props.searchParams
  const db = createAdminClient()

  let q = db.from("orders").select("*").order("created_at", { ascending: false })
  if (status && status in ORDER_STATUS) q = q.eq("status", status)
  const [{ data: ordersData }, { data: storesData }, { data: gbData }] = await Promise.all([
    q,
    db.from("stores").select("*"),
    db.from("group_buys").select("*, product:products(*)"),
  ])
  const orders = (ordersData as Order[]) ?? []
  const stores = (storesData as Store[]) ?? []
  const groupBuys = (gbData as unknown as GroupBuyWithProduct[]) ?? []
  const storeName = (id: string) => stores.find((s) => s.id === id)?.name ?? "-"

  // 발주서용 집계: 매장 × 상품 × 픽업일
  const purchaseMap = new Map<string, { store: string; product: string; pickup: string; qty: number }>()
  for (const o of orders.filter((x) => x.status !== "canceled")) {
    const key = `${o.store_id}|${o.product_name}|${o.pickup_date}`
    const cur = purchaseMap.get(key) ?? { store: storeName(o.store_id), product: o.product_name, pickup: o.pickup_date ?? "-", qty: 0 }
    cur.qty += o.quantity
    purchaseMap.set(key, cur)
  }
  const purchase = [...purchaseMap.values()]

  // 공구별 집계
  const gbSummary = groupBuys.map((gb) => ({
    name: gb.title || gb.product?.name || "-",
    ordered: gb.ordered_qty,
    total: gb.total_qty,
    pickup: gb.pickup_date,
    status: gb.status,
  }))

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">주문 취합</h1>
          <a href="/admin/orders/export" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            ⬇ CSV(엑셀) 다운로드
          </a>
        </div>

        <Section title="공구별 주문 현황">
          <Table head={["공구", "주문수량", "픽업일", "상태"]}>
            {gbSummary.map((g, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-2">{g.name}</td>
                <td className="py-2 pr-2">{g.ordered}{g.total ? `/${g.total}` : ""}개</td>
                <td className="py-2 pr-2">{formatDate(g.pickup)}</td>
                <td className="py-2">{g.status}</td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="매장별 발주 집계 (매장 × 상품 × 픽업일)">
          <Table head={["매장", "상품", "픽업일", "주문수량"]}>
            {purchase.map((p, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-2">{p.store}</td>
                <td className="py-2 pr-2">{p.product}</td>
                <td className="py-2 pr-2">{formatDate(p.pickup)}</td>
                <td className="py-2">{p.qty}개</td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title={`전체 주문 (${orders.length})`}>
          <Table head={["주문번호", "고객", "연락처", "상품", "수량", "매장", "픽업일", "상태"]}>
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="py-2 pr-2 text-xs text-gray-400">{o.order_no}</td>
                <td className="py-2 pr-2">{o.customer_name}</td>
                <td className="py-2 pr-2">{maskPhone(o.phone)}</td>
                <td className="py-2 pr-2">{o.product_name}</td>
                <td className="py-2 pr-2">{o.quantity}</td>
                <td className="py-2 pr-2">{storeName(o.store_id)}</td>
                <td className="py-2 pr-2">{formatDate(o.pickup_date)}</td>
                <td className="py-2"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </Table>
        </Section>

        <p className="mt-4 text-right text-sm text-gray-500">
          예상 매출 합계: {formatPrice(orders.filter((o) => o.status !== "canceled" && o.status !== "no_show").reduce((s, o) => s + o.total_price, 0))}
        </p>
      </main>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white p-4">{children}</div>
    </section>
  )
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full whitespace-nowrap text-sm">
      <thead>
        <tr className="text-left text-gray-500">
          {head.map((h) => <th key={h} className="pb-2 pr-2 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}
