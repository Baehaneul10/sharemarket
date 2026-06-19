import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

// 카카오(Supabase OAuth) 로그인 완료 후 돌아오는 콜백. 인증 코드를 세션으로 교환한다.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 실패 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
