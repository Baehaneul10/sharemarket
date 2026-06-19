import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "@/lib/supabase/config"

// Next.js 16: middleware → proxy. Supabase 세션 토큰을 매 요청마다 갱신한다.
export async function proxy(request: NextRequest) {
  // 지점 링크(?store=ID) 캡처 → 쿠키에 저장하고 깨끗한 주소로 이동
  const storeParam = request.nextUrl.searchParams.get("store")
  if (storeParam) {
    const url = request.nextUrl.clone()
    url.searchParams.delete("store")
    const res = NextResponse.redirect(url)
    res.cookies.set("yy_store", storeParam, { path: "/", maxAge: 60 * 60 * 24 * 180 })
    return res
  }

  let response = NextResponse.next({ request })

  if (!isSupabaseConfigured) return response

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // 세션 갱신 + 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  // 고객 화면은 로그인 필수. 아래 경로는 예외(자체 로그인/콜백 보유 또는 공개).
  const path = request.nextUrl.pathname
  const isExempt =
    path.startsWith("/login") ||
    path.startsWith("/auth") ||
    path.startsWith("/owner") ||
    path.startsWith("/admin")

  if (!user && !isExempt) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`
    return NextResponse.redirect(url)
  }

  // /s/<slug> 진입 → slug로 매장을 찾아 쿠키에 고정 (이후 깊은 페이지 이동용, URL엔 slug 유지)
  const slugMatch = path.match(/^\/s\/([^/]+)\/?$/)
  if (slugMatch) {
    const slug = decodeURIComponent(slugMatch[1])
    const { data: st } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
    if (st?.id) {
      response.cookies.set("yy_store", st.id as string, {
        path: "/",
        maxAge: 60 * 60 * 24 * 180,
      })
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
