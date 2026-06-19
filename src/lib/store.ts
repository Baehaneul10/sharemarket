import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { Store } from "@/types/db"

export const STORE_COOKIE = "yy_store"

// 현재 세션에 고정된 지점 ID (지점 링크로 들어올 때 쿠키에 저장됨)
export async function getStoreId(): Promise<string | null> {
  const c = await cookies()
  return c.get(STORE_COOKIE)?.value ?? null
}

// 고정된 지점 정보 (없거나 비활성 매장이면 null)
export async function getSelectedStore(): Promise<Store | null> {
  if (!isSupabaseConfigured) return null
  const id = await getStoreId()
  if (!id) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("id", id)
      .eq("is_active", true)
      .maybeSingle()
    return (data as Store) ?? null
  } catch {
    return null
  }
}
