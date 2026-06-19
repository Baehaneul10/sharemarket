import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { AdminHeader } from "@/components/AdminHeader"
import { CopyButton } from "@/components/CopyButton"
import { createStoreAction, deleteStoreAction } from "@/app/admin/actions"
import type { Store } from "@/types/db"

const MESSAGES: Record<string, { text: string; tone: string }> = {
  deleted: { text: "매장을 삭제했습니다.", tone: "border-emerald-300 bg-emerald-50 text-emerald-800" },
  has_orders: { text: "주문 이력이 있는 매장은 삭제할 수 없습니다.", tone: "border-amber-300 bg-amber-50 text-amber-800" },
  error: { text: "삭제 중 오류가 발생했습니다.", tone: "border-red-300 bg-red-50 text-red-700" },
}

export default async function AdminStoresPage(props: {
  searchParams: Promise<{ msg?: string }>
}) {
  await requireAdmin()
  const { msg } = await props.searchParams
  const banner = msg ? MESSAGES[msg] : null
  const db = createAdminClient()
  const { data } = await db.from("stores").select("*").order("sort_order")
  const stores = (data as Store[]) ?? []
  const input = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-screen-lg flex-1 px-4 py-6">
        <h1 className="text-lg font-bold">매장 등록</h1>

        {banner && <p className={`mt-3 rounded-xl border p-3 text-sm ${banner.tone}`}>{banner.text}</p>}

        <form action={createStoreAction} className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:grid-cols-2">
          <Field label="매장명 *"><input name="name" required className={input} /></Field>
          <Field label="URL 주소(slug) *"><input name="slug" required placeholder="pangyo (영문/숫자, 매장마다 고유)" className={input} /></Field>
          <Field label="브랜드"><input name="brand" defaultValue="영영상점" className={input} /></Field>
          <Field label="점주명"><input name="owner_name" className={input} /></Field>
          <Field label="연락처"><input name="phone" className={input} /></Field>
          <Field label="주소"><input name="address" className={input} /></Field>
          <Field label="픽업 가능 시간"><input name="pickup_hours" placeholder="15:00~20:00" className={input} /></Field>
          <Field label="오픈채팅방 링크"><input name="openchat_url" className={input} /></Field>
          <Field label="정렬 순서"><input name="sort_order" type="number" defaultValue={0} className={input} /></Field>
          <div className="sm:col-span-2">
            <Field label="점주 로그인 계정 ID (Supabase Auth user UUID, 선택)">
              <input name="auth_user_id" placeholder="점주 로그인 연결 시 입력" className={input} />
            </Field>
          </div>
          <button className="rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 sm:col-span-2 sm:w-fit">
            매장 등록
          </button>
        </form>

        <h2 className="mt-8 mb-2 font-semibold">등록된 매장 ({stores.length})</h2>
        <div className="space-y-2">
          {stores.map((s) => (
            <div key={s.id} className="rounded-2xl border border-gray-200 bg-white p-3 text-sm">
              <p className="font-medium">{s.name} {!s.is_active && <span className="text-gray-400">(중지)</span>}</p>
              <p className="text-gray-500">
                {s.owner_name ?? "-"} · {s.phone ?? "-"} · {s.pickup_hours ?? "-"}
                {s.auth_user_id ? " · 🔑계정 연결됨" : " · 계정 미연결"}
              </p>
              <div className="mt-2 flex items-center gap-2">
                {s.slug ? (
                  <>
                    <code className="flex-1 truncate rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                      {siteUrl || "(배포주소)"}/s/{s.slug}
                    </code>
                    <CopyButton text={`${siteUrl}/s/${s.slug}`} label="지점 링크 복사" />
                  </>
                ) : (
                  <code className="flex-1 truncate rounded bg-amber-50 px-2 py-1 text-xs text-amber-700">
                    URL 주소(slug) 미설정 — 링크를 만들려면 slug를 등록하세요.
                  </code>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-gray-400">↑ 이 링크를 이 지점 오픈채팅방에 공지하세요.</p>
                <form action={deleteStoreAction}>
                  <input type="hidden" name="id" value={s.id} />
                  <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                    매장 삭제
                  </button>
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
