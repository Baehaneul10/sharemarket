import Link from "next/link"
import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminHeader } from "@/components/AdminHeader"
import { formatPrice } from "@/lib/format"
import { CATEGORIES } from "@/lib/constants"
import { createProductAction, updateProductAction, deleteProductAction } from "@/app/admin/actions"
import type { Product } from "@/types/db"

const MESSAGES: Record<string, { text: string; tone: string }> = {
  deleted: { text: "상품을 삭제했습니다.", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  has_orders: { text: "주문 이력이 있는 상품은 삭제할 수 없습니다. 대신 '수정'에서 '고객 화면에 노출'을 꺼서 숨겨주세요.", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  error: { text: "삭제 중 오류가 발생했습니다.", tone: "border-red-300 bg-red-50 text-red-700" },
}

export default async function AdminProductsPage(props: {
  searchParams: Promise<{ edit?: string; msg?: string }>
}) {
  await requireAdmin()
  const { edit, msg } = await props.searchParams
  const db = createAdminClient()
  const [{ data }, { data: gbData }] = await Promise.all([
    db.from("products").select("*").order("created_at", { ascending: false }),
    db.from("group_buys").select("product_id, status"),
  ])
  const products = (data as Product[]) ?? []
  const activeProductIds = new Set(
    ((gbData as { product_id: string; status: string }[]) ?? [])
      .filter((g) => g.status !== "done")
      .map((g) => g.product_id)
  )
  const editing = edit ? products.find((p) => p.id === edit) ?? null : null
  const banner = msg ? MESSAGES[msg] : null

  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">상품 {editing ? "수정" : "등록"}</h1>

        {banner && (
          <p className={`mt-3 rounded-xl border p-3 text-sm ${banner.tone}`}>{banner.text}</p>
        )}

        <p className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          💡 상품을 등록해도 메인 화면에는 바로 보이지 않습니다. 고객에게 판매하려면{" "}
          <Link href="/admin/group-buys" className="font-semibold underline">공구 회차</Link>를 등록해야 메인에 노출됩니다.
        </p>

        <form
          action={editing ? updateProductAction : createProductAction}
          className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
        >
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <Field label="상품명 *"><input name="name" required defaultValue={editing?.name ?? ""} className={input} /></Field>
          <Field label="카테고리">
            <select name="category" defaultValue={editing?.category ?? ""} className={input}>
              <option value="">선택</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="정상가"><input name="normal_price" type="number" defaultValue={editing?.normal_price ?? ""} className={input} /></Field>
          <Field label="공동구매가 *"><input name="group_price" type="number" required defaultValue={editing?.group_price ?? ""} className={input} /></Field>
          <Field label="매장 공급가"><input name="supply_price" type="number" defaultValue={editing?.supply_price ?? ""} className={input} /></Field>
          <Field label="1인 최대 수량"><input name="max_per_person" type="number" defaultValue={editing?.max_per_person ?? 3} className={input} /></Field>
          <Field label="보관방식"><input name="storage" defaultValue={editing?.storage ?? ""} placeholder="실온/냉장/냉동" className={input} /></Field>
          <Field label="원산지"><input name="origin" defaultValue={editing?.origin ?? ""} className={input} /></Field>
          <Field label="유통기한"><input name="expiry" defaultValue={editing?.expiry ?? ""} className={input} /></Field>
          <Field label="알레르기"><input name="allergy" defaultValue={editing?.allergy ?? ""} className={input} /></Field>
          <Field label="대표 이미지 URL"><input name="thumbnail_url" defaultValue={editing?.thumbnail_url ?? ""} className={input} /></Field>
          <Field label="구성"><input name="composition" defaultValue={editing?.composition ?? ""} className={input} /></Field>
          <div className="sm:col-span-2">
            <Field label="상품 설명"><textarea name="description" rows={2} defaultValue={editing?.description ?? ""} className={input} /></Field>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="is_visible" defaultChecked={editing ? editing.is_visible : true} className="h-4 w-4" /> 고객 화면에 노출
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700">
              {editing ? "수정 저장" : "상품 등록"}
            </button>
            {editing && <Link href="/admin/products" className="rounded-xl border border-gray-300 px-5 py-2.5 font-medium">취소</Link>}
          </div>
        </form>

        <h2 className="mt-8 mb-2 font-semibold">등록된 상품 ({products.length})</h2>
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-3 text-sm">
              <div>
                <p className="font-medium">
                  {p.name} {!p.is_visible && <span className="text-gray-400">(숨김)</span>}
                  {activeProductIds.has(p.id) ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-700">판매중</span>
                  ) : (
                    <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">공구 없음 · 메인 미노출</span>
                  )}
                </p>
                <p className="text-gray-500">{p.category ?? "-"} · {formatPrice(p.group_price)}</p>
              </div>
              <div className="flex items-center gap-2">
                {!activeProductIds.has(p.id) && (
                  <Link href="/admin/group-buys" className="rounded-lg border border-emerald-300 px-3 py-1.5 text-emerald-700">공구 만들기</Link>
                )}
                <Link href={`/admin/products?edit=${p.id}`} className="rounded-lg border border-gray-300 px-3 py-1.5">수정</Link>
                <form action={deleteProductAction}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="rounded-lg border border-red-300 px-3 py-1.5 text-red-600">삭제</button>
                </form>
              </div>
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
