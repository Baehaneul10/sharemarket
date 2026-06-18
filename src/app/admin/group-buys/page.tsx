import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminHeader } from "@/components/AdminHeader"
import { formatDate } from "@/lib/format"
import { createGroupBuyAction, updateGroupBuyStatusAction } from "@/app/admin/actions"
import type { Product, Store, GroupBuyWithProduct } from "@/types/db"

const STATUSES = ["ready", "selling", "closed", "incoming", "picking", "done"]

export default async function AdminGroupBuysPage() {
  await requireAdmin()
  const db = createAdminClient()
  const [{ data: prods }, { data: strs }, { data: gbs }] = await Promise.all([
    db.from("products").select("*").order("created_at", { ascending: false }),
    db.from("stores").select("*").order("sort_order"),
    db.from("group_buys").select("*, product:products(*)").order("created_at", { ascending: false }),
  ])
  const products = (prods as Product[]) ?? []
  const stores = (strs as Store[]) ?? []
  const groupBuys = (gbs as unknown as GroupBuyWithProduct[]) ?? []
  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">공구 회차 등록</h1>

        <form action={createGroupBuyAction} className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
          <Field label="상품 *">
            <select name="product_id" required defaultValue="" className={input}>
              <option value="" disabled>상품 선택</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="공구명"><input name="title" placeholder="예) 제주 흑돼지 1차 공구" className={input} /></Field>
          <Field label="판매 시작"><input name="sale_start" type="datetime-local" className={input} /></Field>
          <Field label="판매 마감 *"><input name="sale_end" type="datetime-local" required className={input} /></Field>
          <Field label="픽업 예정일 *"><input name="pickup_date" type="date" required className={input} /></Field>
          <Field label="총 판매 수량"><input name="total_qty" type="number" className={input} /></Field>
          <Field label="상태">
            <select name="status" defaultValue="selling" className={input}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-gray-600">참여 매장 (선택 안 하면 전체 매장)</span>
            <div className="flex flex-wrap gap-3">
              {stores.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" name="store_ids" value={s.id} className="h-4 w-4" /> {s.name}
                </label>
              ))}
            </div>
          </div>
          <button className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 sm:col-span-2 sm:w-fit">
            공구 등록
          </button>
        </form>

        <h2 className="mt-8 mb-2 font-semibold">진행 중인 공구 ({groupBuys.length})</h2>
        <div className="space-y-2">
          {groupBuys.map((gb) => (
            <div key={gb.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium">{gb.title || gb.product?.name}</p>
                <p className="text-gray-500">
                  마감 {formatDate(gb.sale_end)} · 픽업 {formatDate(gb.pickup_date)} · 주문 {gb.ordered_qty}
                  {gb.total_qty ? `/${gb.total_qty}` : ""}개
                </p>
              </div>
              <form action={updateGroupBuyStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={gb.id} />
                <select name="status" defaultValue={gb.status} className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="rounded-lg border border-gray-300 px-3 py-1.5">변경</button>
              </form>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-gray-600">{label}</span>
      {children}
    </label>
  )
}
