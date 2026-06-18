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
    thumbnail_url: String(formData.get("thumbnail_url") ?? "") || null,
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
    is_visible: formData.get("is_visible") === "on",
  }
}

export async function createProductAction(formData: FormData) {
  await requireAdmin()
  const db = createAdminClient()
  await db.from("products").insert(productPayload(formData))
  revalidatePath("/admin/products")
}

export async function updateProductAction(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get("id"))
  const db = createAdminClient()
  await db.from("products").update({ ...productPayload(formData), updated_at: new Date().toISOString() }).eq("id", id)
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

export async function adminLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}
