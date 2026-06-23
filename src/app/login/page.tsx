import { redirect } from "next/navigation"
import { KakaoLoginButton } from "@/components/KakaoLoginButton"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { BRAND } from "@/lib/constants"

export default async function CustomerLoginPage(props: {
  searchParams: Promise<{ next?: string; msg?: string }>
}) {
  const { next = "/", msg } = await props.searchParams

  // 이미 로그인했으면 메인으로
  if (isSupabaseConfigured) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) redirect(next)
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-sky-50 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-sm">
        {msg === "withdrawn" && (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-sm text-emerald-800">
            회원 탈퇴가 완료되었습니다.
          </p>
        )}
        <div className="rounded-2xl border-2 border-sky-300 px-5 py-7 text-center">
          <p className="text-2xl font-extrabold leading-snug text-sky-500">
            오늘 주문하면<br />가까운 매장에서 픽업
          </p>
        </div>

        <h1 className="mt-6 text-center text-2xl font-extrabold text-blue-800">{BRAND}</h1>
        <p className="mt-1 text-center text-sm text-gray-500">매장 픽업 공동구매 마켓</p>

        <div className="mt-7">
          <KakaoLoginButton next={next} />
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          로그인하면 픽업 일정과 신규 공구 소식을 받아볼 수 있어요.
        </p>
      </div>
    </main>
  )
}
