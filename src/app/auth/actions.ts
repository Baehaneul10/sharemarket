"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getActiveStores } from "@/lib/queries"

// 고객 로그아웃
export async function customerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

// 회원 탈퇴: 계정 삭제 + 주문의 개인정보 익명화(금액 기록은 보존)
export async function deleteMyAccountAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  // 개인정보 익명화 (매출/주문 기록은 남기되 이름·연락처는 제거)
  await admin
    .from("orders")
    .update({ customer_name: "탈퇴회원", email: null, phone: null })
    .eq("user_id", user.id)
  // 계정 삭제 (auth.users)
  await admin.auth.admin.deleteUser(user.id)
  // 현재 세션 정리
  try { await supabase.auth.signOut() } catch { /* 무시 */ }

  redirect("/login?msg=withdrawn")
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
