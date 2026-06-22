"use client"

import { useEffect } from "react"

// 매장 카탈로그를 볼 때 선택 매장을 쿠키에 확실히 저장한다.
// (proxy가 /s/[slug]에서 쿠키를 못 심는 경우 대비 — 이후 주문/상세 페이지가 쿠키로 매장을 찾음)
export function StoreCookieSync({ storeId }: { storeId: string }) {
  useEffect(() => {
    document.cookie = `yy_store=${storeId}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`
  }, [storeId])
  return null
}
