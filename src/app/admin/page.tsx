import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminHeader } from "@/components/AdminHeader"
import { formatPrice } from "@/lib/format"
import type { Order, Store } from "@/types/db"

export default async function AdminDashboard() {
  await requireAdmin()
  const db = createAdminClient()
  const [{ data: ordersData }, { data: storesData }] = await Promise.all([
    db.from("orders").select("*"),
    db.from("stores").select("*"),
  ])
  const orders = (ordersData as Order[]) ?? []
  const stores = (storesData as Store[]) ?? []

  const valid = orders.filter((o) => o.status !== "canceled")
  const picked = orders.filter((o) => o.status === "picked_up")
  const pickupRate = valid.length ? Math.round((picked.length / valid.length) * 100) : 0
  const expectedRevenue = valid.filter((o) => o.status !== "no_show").reduce((s, o) => s + o.total_price, 0)

  const cards = [
    { label: "전체 주문", value: `${orders.length}건` },
    { label: "픽업 완료", value: `${picked.length}건` },
    { label: "픽업 완료율", value: `${pickupRate}%` },
    { label: "예상 매출", value: formatPrice(expectedRevenue) },
  ]

  // 매장별 집계
  const byStore = stores.map((s) => {
    const list = orders.filter((o) => o.store_id === s.id && o.status !== "canceled")
    return {
      name: s.name,
      count: list.length,
      picked: list.filter((o) => o.status === "picked_up").length,
      revenue: list.filter((o) => o.status !== "no_show").reduce((sum, o) => sum + o.total_price, 0),
    }
  })

  // 상품별 집계
  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const o of valid) {
    const cur = productMap.get(o.product_name) ?? { name: o.product_name, qty: 0, revenue: 0 }
    cur.qty += o.quantity
    if (o.status !== "no_show") cur.revenue += o.total_price
    productMap.set(o.product_name, cur)
  }
  const byProduct = [...productMap.values()].sort((a, b) => b.qty - a.qty)

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">대시보드</h1>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500">{c.label}</p>
              <p className="mt-1 text-xl font-bold">{c.value}</p>
            </div>
          ))}
        </div>

        <Section title="상품별 판매">
          <Table head={["상품", "주문 수량", "예상 매출"]}>
            {byProduct.map((p) => (
              <tr key={p.name} className="border-t">
                <td className="py-2 pr-2">{p.name}</td>
                <td className="py-2 pr-2">{p.qty}개</td>
                <td className="py-2">{formatPrice(p.revenue)}</td>
              </tr>
            ))}
          </Table>
        </Section>

        <Section title="매장별 현황">
          <Table head={["매장", "주문", "픽업완료", "예상 매출"]}>
            {byStore.map((s) => (
              <tr key={s.name} className="border-t">
                <td className="py-2 pr-2">{s.name}</td>
                <td className="py-2 pr-2">{s.count}건</td>
                <td className="py-2 pr-2">{s.picked}건</td>
                <td className="py-2">{formatPrice(s.revenue)}</td>
              </tr>
            ))}
          </Table>
        </Section>
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
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-gray-500">
          {head.map((h) => <th key={h} className="pb-2 pr-2 font-medium">{h}</th>)}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}
