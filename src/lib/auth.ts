import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { adminEmails, isSupabaseConfigured } from "@/lib/supabase/config"
import type { Store } from "@/types/db"

// 로그인한 점주의 매장 반환 (없으면 null)
export async function getCurrentStore(): Promise<Store | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle()
  return (data as Store) ?? null
}

// 점주 인증 필수 — 미로그인 시 로그인 페이지로
export async function requireOwner(): Promise<Store> {
  const store = await getCurrentStore()
  if (!store) redirect("/owner/login")
  return store
}

// 본사 관리자 인증 필수 — ADMIN_EMAILS 화이트리스트 확인
export async function requireAdmin(): Promise<{ email: string }> {
  if (!isSupabaseConfigured) redirect("/admin/login")
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const email = user?.email?.toLowerCase()
  if (!email || !adminEmails().includes(email)) redirect("/admin/login")
  return { email }
}

export async function getCurrentUserEmail(): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.email ?? null
}
