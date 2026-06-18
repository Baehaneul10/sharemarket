import Link from "next/link"
import { CategoryTabs } from "@/components/CategoryTabs"
import { ProductCard } from "@/components/ProductCard"
import { OpenChatButton } from "@/components/OpenChatButton"
import { getActiveGroupBuys } from "@/lib/queries"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { BRAND, COPY } from "@/lib/constants"

export default async function HomePage(props: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await props.searchParams
  const groupBuys = await getActiveGroupBuys(cat)

  return (
    <main className="mx-auto w-full max-w-screen-md flex-1 px-4 pb-16">
      {/* 상단 배너 */}
      <header className="-mx-4 mb-4 bg-emerald-600 px-4 py-7 text-white">
        <h1 className="text-2xl font-bold">{BRAND}</h1>
        <p className="mt-1 text-sm/relaxed text-emerald-50">오늘 주문하면 D+2 매장 픽업</p>
        <p className="mt-3 whitespace-pre-line text-sm/relaxed text-emerald-50">{COPY.mainBanner}</p>
      </header>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          ⚠️ Supabase가 아직 연결되지 않았습니다. <code>.env.local</code>에 키를 입력하고
          <code> supabase/schema.sql</code>, <code>supabase/seed.sql</code>을 실행하면 상품이 표시됩니다.
        </div>
      )}

      {/* 카테고리 */}
      <div className="mb-4">
        <CategoryTabs active={cat} />
      </div>

      {/* 상품 목록 */}
      {groupBuys.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-500">
          {cat ? `'${cat}' 카테고리에 진행 중인 공구가 없습니다.` : "진행 중인 공구가 없습니다."}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {groupBuys.map((gb) => (
            <ProductCard key={gb.id} gb={gb} />
          ))}
        </div>
      )}

      {/* 오픈채팅 안내 */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold">{BRAND} 공구방</h2>
        <p className="mt-1 mb-3 text-sm text-gray-500">
          픽업 일정과 신규 상품 소식을 가장 먼저 받아보세요.
        </p>
        <OpenChatButton />
      </section>

      {/* 푸터 링크 */}
      <footer className="mt-10 flex justify-center gap-4 text-xs text-gray-400">
        <Link href="/order/lookup" className="hover:text-gray-600">주문 조회</Link>
        <span>·</span>
        <Link href="/owner/login" className="hover:text-gray-600">점주 로그인</Link>
        <span>·</span>
        <Link href="/admin/login" className="hover:text-gray-600">본사 관리자</Link>
      </footer>
    </main>
  )
}
