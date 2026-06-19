import { getActiveStores } from "@/lib/queries"
import { getSelectedStore } from "@/lib/store"
import { customerLogoutAction, selectStoreAction } from "@/app/auth/actions"
import { StoreHome } from "@/components/StoreHome"
import { BRAND } from "@/lib/constants"

export default async function HomePage(props: {
  searchParams: Promise<{ cat?: string }>
}) {
  const { cat } = await props.searchParams
  const store = await getSelectedStore()

  // 지점이 고정되지 않은 경우 → 매장 선택 화면 (선택 시 /s/<slug> 로 입장)
  if (!store) {
    const stores = (await getActiveStores()).filter((s) => s.slug)
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-6 text-center">
        <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-xl font-extrabold text-blue-800">{BRAND}</h1>
          {stores.length === 0 ? (
            <p className="mt-4 text-sm/relaxed text-gray-600">
              지점 공구 링크로 접속해 주세요.<br />
              각 매장의 오픈채팅방에 올라온 링크를 통해 입장할 수 있어요.
            </p>
          ) : (
            <form action={selectStoreAction} className="mt-5 space-y-3 text-left">
              <p className="text-center text-sm text-gray-600">입장할 매장을 선택해 주세요.</p>
              <select
                name="slug"
                required
                defaultValue=""
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="" disabled>매장 선택</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.slug ?? ""}>{s.name}</option>
                ))}
              </select>
              <button className="w-full rounded-xl bg-blue-700 py-3 font-semibold text-white hover:bg-blue-800">
                들어가기
              </button>
            </form>
          )}
          <form action={customerLogoutAction} className="mt-6">
            <button className="text-xs text-gray-400 hover:text-gray-600">로그아웃</button>
          </form>
        </div>
      </main>
    )
  }

  // 이미 지점이 고정된 경우 (쿠키) → 해당 매장 카탈로그
  return <StoreHome store={store} cat={cat} />
}
