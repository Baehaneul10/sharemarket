import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { GroupBuyWithProduct, Store } from "@/types/db"

// 공개(고객) 데이터 조회. Supabase 미설정/오류 시 빈 결과로 안전하게 동작.

export async function getActiveGroupBuys(category?: string): Promise<GroupBuyWithProduct[]> {
  if (!isSupabaseConfigured) return []
  try {
    const supabase = await createClient()
    let query = supabase
      .from("group_buys")
      .select("*, product:products(*)")
      .neq("status", "done")
      .order("created_at", { ascending: false })

    const { data, error } = await query
    if (error || !data) return []

    let rows = data as unknown as GroupBuyWithProduct[]
    rows = rows.filter((gb) => gb.product && gb.product.is_visible)
    if (category) rows = rows.filter((gb) => gb.product?.category === category)
    return rows
  } catch {
    return []
  }
}

export async function getGroupBuyById(id: string): Promise<GroupBuyWithProduct | null> {
  if (!isSupabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("group_buys")
      .select("*, product:products(*)")
      .eq("id", id)
      .maybeSingle()
    if (error || !data) return null
    return data as unknown as GroupBuyWithProduct
  } catch {
    return null
  }
}

export async function getGroupBuyByProductId(productId: string): Promise<GroupBuyWithProduct | null> {
  if (!isSupabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("group_buys")
      .select("*, product:products(*)")
      .eq("product_id", productId)
      .neq("status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
    const rows = (data as unknown as GroupBuyWithProduct[]) ?? []
    return rows[0] ?? null
  } catch {
    return null
  }
}

export async function getActiveStores(): Promise<Store[]> {
  if (!isSupabaseConfigured) return []
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
    return (data as Store[]) ?? []
  } catch {
    return []
  }
}
