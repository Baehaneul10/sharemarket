"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

function num(v: FormDataEntryValue | null): number | null {
  if (v == null || v === "") return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function productPayload(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    category: String(formData.get("category") ?? "") || null,
    description: String(formData.get("description") ?? "") || null,
    composition: String(formData.get("composition") ?? "") || null,
    normal_price: num(formData.get("normal_price")),
    group_price: num(formData.get("group_price")) ?? 0,
    supply_price: num(formData.get("supply_price")),
    storage: String(formData.get("storage") ?? "") || null,
    origin: String(formData.get("origin") ?? "") || null,
    expiry: String(formData.get("expiry") ?? "") || null,
    allergy: String(formData.get("allergy") ?? "") || null,
    max_per_person: num(formData.get("max_per_person")) ?? 3,
    store_ids: formData.getAll("store_ids").map(String).filter(Boolean),
    is_visible: formData.get("is_visible") === "on",
  }
}

// 상품 이미지 업로드 → Supabase Storage('products' 버킷) → 공개 URL 반환
async function uploadProductImage(formData: FormData): Promise<string | null> {
  const f = formData.get("image")
  if (!(f instanceof File) || f.size === 0) return null
  const db = createAdminClient()
  const ext = (f.name.split(".").pop() || "jpg").toLowerCase()
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await db.storage.from("products").upload(path, f, {
    contentType: f.type || "image/jpeg",
    upsert: false,
  })
  if (error) return null
  return db.storage.from("products").getPublicUrl(path).data.publicUrl
}

export async function createProductAction(formData: FormData) {
  await requireAdmin()
  const db = createAdminClient()
  const thumbnail_url = await uploadProductImage(formData)
  await db.from("products").insert({ ...productPayload(formData), thumbnail_url })
  revalidatePath("/admin/products")
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id"))
  const db = createAdminClient()
  const uploaded = await uploadProductImage(formData)
  const existing = String(formData.get("existing_thumbnail") ?? "") || null
  await db.from("products")
    .update({ ...productPayload(formData), thumbnail_url: uploaded ?? existing, updated_at: new Date().toISOString() })
    .eq("id", id)
  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id"))
  const db = createAdminClient()

  // 주문이 있는 상품은 주문 기록 보호를 위해 삭제 불가 → '숨김'으로 안내
  const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("product_id", id)
  if (count && count > 0) {
    redirect("/admin/products?msg=has_orders")
  }

  const { error } = await db.from("products").delete().eq("id", id)
  revalidatePath("/admin/products")
  redirect(error ? "/admin/products?msg=error" : "/admin/products?msg=deleted")
}

export async function createGroupBuyAction(formData: FormData) {
  await requireAdmin()
  const storeIds = formData.getAll("store_ids").map(String).filter(Boolean)
  const db = createAdminClient()
  await db.from("group_buys").insert({
    product_id: String(formData.get("product_id")),
    title: String(formData.get("title") ?? "") || null,
    sale_start: String(formData.get("sale_start") ?? "") || null,
    sale_end: String(formData.get("sale_end")),
    pickup_date: String(formData.get("pickup_date")),
    total_qty: num(formData.get("total_qty")),
    store_ids: storeIds,
    status: String(formData.get("status") ?? "selling"),
  })
  revalidatePath("/admin/group-buys")
}

export async function updateGroupBuyStatusAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id"))
  const status = String(formData.get("status"))
  const db = createAdminClient()
  await db.from("group_buys").update({ status }).eq("id", id)
  revalidatePath("/admin/group-buys")
}

export async function createStoreAction(formData: FormData) {
  await requireAdmin()
  const db = createAdminClient()
  await db.from("stores").insert({
    name: String(formData.get("name") ?? "").trim(),
    brand: String(formData.get("brand") ?? "") || null,
    owner_name: String(formData.get("owner_name") ?? "") || null,
    phone: String(formData.get("phone") ?? "") || null,
    address: String(formData.get("address") ?? "") || null,
    pickup_hours: String(formData.get("pickup_hours") ?? "") || null,
    openchat_url: String(formData.get("openchat_url") ?? "") || null,
    auth_user_id: String(formData.get("auth_user_id") ?? "") || null,
    sort_order: num(formData.get("sort_order")) ?? 0,
  })
  revalidatePath("/admin/stores")
}

export async function deleteStoreAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id"))
  const db = createAdminClient()

  // 주문이 있는 매장은 주문 기록 보호를 위해 삭제 불가
  const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("store_id", id)
  if (count && count > 0) {
    redirect("/admin/stores?msg=has_orders")
  }

  const { error } = await db.from("stores").delete().eq("id", id)
  revalidatePath("/admin/stores")
  redirect(error ? "/admin/stores?msg=error" : "/admin/stores?msg=deleted")
}

export async function adminLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}
