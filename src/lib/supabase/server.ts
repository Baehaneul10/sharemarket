import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config"

// 서버 컴포넌트 / 서버 액션용 Supabase 클라이언트 — 쿠키 기반 세션 (anon 키 + RLS 적용)
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // 서버 컴포넌트에서 set 호출 시 무시 (proxy.ts에서 세션 갱신 처리)
        }
      },
    },
  })
}
