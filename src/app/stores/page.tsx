import Link from "next/link"
import { getActiveStores } from "@/lib/queries"
import { BRAND } from "@/lib/constants"

// 매장 선택/변경 화면. 각 매장은 /s/<slug> 로 이동(쿠키 갱신).
export default async function StoresPage() {
  const stores = (await getActiveStores()).filter((s) => s.slug)

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-extrabold text-blue-800">{BRAND}</h1>
        <p className="mt-2 text-center text-sm text-gray-600">매장을 선택하세요.</p>

        {stores.length === 0 ? (
          <p className="mt-5 text-center text-sm text-gray-500">등록된 매장이 없습니다.</p>
        ) : (
          <ul className="mt-5 space-y-2">
            {stores.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/s/${s.slug}`}
                  className="block rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-semibold text-gray-800 hover:border-blue-300 hover:bg-blue-50"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href="/" className="mt-5 block text-center text-xs text-gray-400 hover:text-gray-600">
          ← 돌아가기
        </Link>
      </div>
    </main>
  )
}
