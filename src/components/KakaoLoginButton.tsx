"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { isSupabaseConfigured } from "@/lib/supabase/config"

export function KakaoLoginButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setError(null)
    if (!isSupabaseConfigured) {
      setError("서버가 아직 연결되지 않았습니다.")
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        // 닉네임만 요청 (이메일은 비즈앱 인증이 필요하므로 제외) — KOE205 방지
        scopes: "profile_nickname",
      },
    })
    if (error) {
      setLoading(false)
      setError("카카오 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.")
    }
    // 성공 시 카카오 페이지로 자동 이동됨
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleLogin}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 font-semibold text-[#191600] hover:brightness-95 disabled:opacity-60"
      >
        <span className="text-lg">💬</span>
        {loading ? "이동 중..." : "카카오 로그인"}
      </button>
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  )
}
