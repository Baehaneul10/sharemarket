import Link from "next/link"
import { CategoryTabs } from "@/components/CategoryTabs"
import { StoreCatalogList } from "@/components/StoreCatalogList"
import { OpenChatButton } from "@/components/OpenChatButton"
import { Countdown } from "@/components/Countdown"
import { getCatalog } from "@/lib/queries"
import { isClosed } from "@/lib/format"
import { BRAND } from "@/lib/constants"
import { StoreCookieSync } from "@/components/StoreCookieSync"
import { SiteFooter } from "@/components/SiteFooter"
import type { Store } from "@/types/db"

// 특정 매장의 메인 카탈로그 화면 (홈 '/' 과 '/s/[slug]' 에서 공통 사용)
export async function StoreHome({ store, cat }: { store: Store; cat?: string }) {
  const items = await getCatalog(store.id, cat)

  const soonest = items
    .map((it) => it.groupBuy)
    .filter((gb): gb is NonNullable<typeof gb> => !!gb && !isClosed(gb.sale_end))
    .map((gb) => gb.sale_end)
    .sort()[0]

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-32">
      <StoreCookieSync storeId={store.id} />

      {/* 상단바 (흰 배경 + 파랑 포인트) */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-blue-600">{BRAND}</Link>
            <Link href="/stores" className="text-xs text-gray-400 underline-offset-2 hover:underline">
              {store.name} ▾
            </Link>
          </div>
          <Link
            href="/order/lookup"
            className="rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            마이페이지
          </Link>
        </div>
      </div>

      {soonest && (
        <div className="mt-4">
          <Countdown deadline={soonest} />
        </div>
      )}

      <div className="mb-4 mt-4">
        <CategoryTabs active={cat} />
      </div>

      <StoreCatalogList storeId={store.id} items={items} />

      <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-4">
        <h2 className="font-semibold text-gray-900">{store.name} 공구방</h2>
        <p className="mt-1 mb-3 text-sm text-gray-500">픽업 일정과 신규 상품 소식을 받아보세요.</p>
        <OpenChatButton url={store.openchat_url} />
      </section>

      <SiteFooter />
    </main>
  )
}
