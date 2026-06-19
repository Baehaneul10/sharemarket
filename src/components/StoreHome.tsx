import Link from "next/link"
import { CategoryTabs } from "@/components/CategoryTabs"
import { ProductCard } from "@/components/ProductCard"
import { OpenChatButton } from "@/components/OpenChatButton"
import { Countdown } from "@/components/Countdown"
import { getCatalog } from "@/lib/queries"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { isClosed } from "@/lib/format"
import { BRAND } from "@/lib/constants"
import type { Store } from "@/types/db"

function nickname(meta: Record<string, unknown> | undefined): string {
  if (!meta) return "고객"
  return (
    (meta.name as string) ||
    (meta.full_name as string) ||
    (meta.nickname as string) ||
    (meta.preferred_username as string) ||
    (meta.user_name as string) ||
    "고객"
  )
}

// 특정 매장의 메인 카탈로그 화면 (홈 '/' 과 '/s/[slug]' 에서 공통 사용)
export async function StoreHome({ store, cat }: { store: Store; cat?: string }) {
  const items = await getCatalog(store.id, cat)

  let name = "고객"
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    name = nickname(user?.user_metadata)
  }

  const soonest = items
    .map((it) => it.groupBuy)
    .filter((gb): gb is NonNullable<typeof gb> => !!gb && !isClosed(gb.sale_end))
    .map((gb) => gb.sale_end)
    .sort()[0]

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-16">
      {/* 고정 상단바 */}
      <div className="sticky top-0 z-20 -mx-4 bg-blue-800 px-4 py-3 text-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h1 className="text-lg font-extrabold">{BRAND}</h1>
            <span className="text-xs text-sky-100">{store.name}</span>
          </div>
          <Link
            href="/order/lookup"
            className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30"
          >
            마이페이지
          </Link>
        </div>
      </div>

      {/* 인사 배너 */}
      <div className="-mx-4 mb-4 bg-gradient-to-b from-blue-700 to-blue-600 px-4 pb-5 pt-4 text-white">
        <p className="text-lg font-bold">안녕하세요, {name} 님 👋</p>
        <p className="mt-1 text-sm text-sky-100">오늘 주문하면 가까운 매장에서 픽업하세요.</p>
      </div>

      {soonest && (
        <div className="mb-4">
          <Countdown deadline={soonest} />
        </div>
      )}

      <div className="mb-4">
        <CategoryTabs active={cat} />
      </div>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          {cat ? `'${cat}' 카테고리에 판매 중인 상품이 없습니다.` : "판매 중인 상품이 없습니다."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((it) => (
            <ProductCard key={it.product.id} item={it} />
          ))}
        </div>
      )}

      <section className="mt-8 rounded-2xl border border-sky-100 bg-white p-4">
        <h2 className="font-semibold text-blue-800">{store.name} 공구방</h2>
        <p className="mt-1 mb-3 text-sm text-gray-500">픽업 일정과 신규 상품 소식을 받아보세요.</p>
        <OpenChatButton url={store.openchat_url} />
      </section>
    </main>
  )
}
