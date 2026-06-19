import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import type { GroupBuy, GroupBuyWithProduct, Product, Store } from "@/types/db"

// 카탈로그 항목: 상품 + (있으면) 현재 지점에서 유효한 공구 회차
export type CatalogItem = { product: Product; groupBuy: GroupBuy | null }

function gbForStore(gb: GroupBuy, storeId: string): boolean {
  return (
    gb.status !== "done" &&
    (!gb.store_ids?.length || gb.store_ids.includes(storeId)) &&
    new Date(gb.sale_end).getTime() > Date.now()
  )
}

// 상품이 해당 지점에 노출되는지: store_ids 가 비어있으면 전체 매장, 아니면 포함된 매장만
function productForStore(p: Product, storeId: string): boolean {
  return !p.store_ids?.length || p.store_ids.includes(storeId)
}

// 메인 카탈로그: '노출' 체크된 상품 전부 + 각 상품의 유효 공구(있으면) 연결
export async function getCatalog(storeId: string, category?: string): Promise<CatalogItem[]> {
  if (!isSupabaseConfigured) return []
  try {
    const supabase = await createClient()
    const [{ data: prods }, { data: gbs }] = await Promise.all([
      supabase.from("products").select("*").eq("is_visible", true).order("created_at", { ascending: false }),
      supabase.from("group_buys").select("*").neq("status", "done"),
    ])
    let products = (prods as Product[]) ?? []
    products = products.filter((p) => productForStore(p, storeId))
    if (category) products = products.filter((p) => p.category === category)
    const groupBuys = (gbs as GroupBuy[]) ?? []
    return products.map((product) => ({
      product,
      groupBuy: groupBuys.find((g) => g.product_id === product.id && gbForStore(g, storeId)) ?? null,
    }))
  } catch {
    return []
  }
}

// 상품 1개 + 유효 공구 (상세/주문 페이지용)
export async function getCatalogItem(productId: string, storeId: string): Promise<CatalogItem | null> {
  if (!isSupabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data: prod } = await supabase
      .from("products").select("*").eq("id", productId).eq("is_visible", true).maybeSingle()
    if (!prod || !productForStore(prod as Product, storeId)) return null
    const { data: gbs } = await supabase
      .from("group_buys").select("*").eq("product_id", productId).neq("status", "done")
    const gb = ((gbs as GroupBuy[]) ?? []).find((g) => gbForStore(g, storeId)) ?? null
    return { product: prod as Product, groupBuy: gb }
  } catch {
    return null
  }
}

// 공개(고객) 데이터 조회. Supabase 미설정/오류 시 빈 결과로 안전하게 동작.

export async function getActiveGroupBuys(
  category?: string,
  storeId?: string
): Promise<GroupBuyWithProduct[]> {
  if (!isSupabaseConfigured) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("group_buys")
      .select("*, product:products(*)")
      .neq("status", "done")
      .order("created_at", { ascending: false })

    if (error || !data) return []

    let rows = data as unknown as GroupBuyWithProduct[]
    rows = rows.filter((gb) => gb.product && gb.product.is_visible)
    // 지점 참여 필터: store_ids 가 비어있으면 전체 매장, 아니면 해당 지점 포함된 공구만
    if (storeId) {
      rows = rows.filter((gb) => !gb.store_ids?.length || gb.store_ids.includes(storeId))
    }
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

// slug(예: 'pangyo')로 활성 매장 1개 조회
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  if (!isSupabaseConfigured) return null
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle()
    return (data as Store) ?? null
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
