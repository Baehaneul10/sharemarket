"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getActiveStores } from "@/lib/queries"

// 고객 로그아웃
export async function customerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// 매장 선택 → /s/<slug> 로 입장 (쿠키 고정은 proxy.ts 에서 처리)
export async function selectStoreAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "")
  if (!slug) redirect("/")

  // 실제로 존재하는 활성 매장의 slug인지 확인 후에만 이동
  const stores = await getActiveStores()
  if (!stores.some((s) => s.slug === slug)) redirect("/")

  redirect(`/s/${slug}`)
}
