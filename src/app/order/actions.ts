"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { getStoreId } from "@/lib/store"

export type CreateOrderResult =
  | { ok: true; orderNo: string }
  | { ok: false; error: string }

export async function createOrderAction(
  _prev: CreateOrderResult | null,
  formData: FormData
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "서버가 아직 Supabase에 연결되지 않았습니다. (.env.local 설정 필요)" }
  }

  const groupBuyId = String(formData.get("group_buy_id") ?? "")
  const quantity = Number(formData.get("quantity") ?? 0)
  const storeId = await getStoreId() // 지점은 링크(쿠키)에서 결정

  if (!storeId) return { ok: false, error: "지점 공구 링크로 다시 접속해주세요." }
  if (!groupBuyId) return { ok: false, error: "공구 정보가 올바르지 않습니다." }
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "수량을 확인해주세요." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "로그인이 필요합니다." }

  const m = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = (m.name as string) || (m.full_name as string) || (m.nickname as string) || "고객"
  const email = user.email ?? (m.email as string) ?? null

  const { data, error } = await supabase.rpc("create_order", {
    p_group_buy_id: groupBuyId,
    p_store_id: storeId,
    p_quantity: quantity,
    p_customer_name: name,
    p_email: email,
  })

  if (error) return { ok: false, error: error.message || "주문 처리 중 오류가 발생했습니다." }

  const order = Array.isArray(data) ? data[0] : data
  if (!order?.order_no) return { ok: false, error: "주문 생성에 실패했습니다." }

  return { ok: true, orderNo: order.order_no as string }
}

// 공구 없이 상품을 바로 주문 (D+2 픽업)
export async function createProductOrderAction(
  _prev: CreateOrderResult | null,
  formData: FormData
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "서버가 아직 Supabase에 연결되지 않았습니다." }
  }

  const productId = String(formData.get("product_id") ?? "")
  const quantity = Number(formData.get("quantity") ?? 0)
  const storeId = await getStoreId()

  if (!storeId) return { ok: false, error: "지점 공구 링크로 다시 접속해주세요." }
  if (!productId) return { ok: false, error: "상품 정보가 올바르지 않습니다." }
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "수량을 확인해주세요." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "로그인이 필요합니다." }

  const m = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = (m.name as string) || (m.full_name as string) || (m.nickname as string) || "고객"
  const email = user.email ?? (m.email as string) ?? null

  const { data, error } = await supabase.rpc("create_product_order", {
    p_product_id: productId,
    p_store_id: storeId,
    p_quantity: quantity,
    p_customer_name: name,
    p_email: email,
  })

  if (error) return { ok: false, error: error.message || "주문 처리 중 오류가 발생했습니다." }
  const order = Array.isArray(data) ? data[0] : data
  if (!order?.order_no) return { ok: false, error: "주문 생성에 실패했습니다." }
  return { ok: true, orderNo: order.order_no as string }
}

// ── 메인 화면에서 여러 상품 한 번에 예약 ──────────────────────
export type BatchOrderItem = { kind: "gb" | "product"; id: string; quantity: number }
export type BatchOrderResult =
  | { ok: true; orderNos: string[] }
  | { ok: false; error: string }

export async function createBatchOrderAction(items: BatchOrderItem[]): Promise<BatchOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "서버가 아직 Supabase에 연결되지 않았습니다." }
  }
  const storeId = await getStoreId()
  if (!storeId) return { ok: false, error: "매장 정보가 없습니다. 매장을 다시 선택해주세요." }

  const valid = (items ?? []).filter(
    (it) => it && it.id && Number.isInteger(it.quantity) && it.quantity >= 1
  )
  if (valid.length === 0) return { ok: false, error: "예약할 상품을 선택해주세요." }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "로그인이 필요합니다." }

  const m = (user.user_metadata ?? {}) as Record<string, unknown>
  const name = (m.name as string) || (m.full_name as string) || (m.nickname as string) || "고객"
  const email = user.email ?? (m.email as string) ?? null

  const orderNos: string[] = []
  let firstError = ""
  for (const it of valid) {
    const { data, error } = it.kind === "gb"
      ? await supabase.rpc("create_order", {
          p_group_buy_id: it.id, p_store_id: storeId, p_quantity: it.quantity,
          p_customer_name: name, p_email: email,
        })
      : await supabase.rpc("create_product_order", {
          p_product_id: it.id, p_store_id: storeId, p_quantity: it.quantity,
          p_customer_name: name, p_email: email,
        })
    if (error) { if (!firstError) firstError = error.message; continue }
    const order = Array.isArray(data) ? data[0] : data
    if (order?.order_no) orderNos.push(order.order_no as string)
  }

  if (orderNos.length === 0) return { ok: false, error: firstError || "주문 생성에 실패했습니다." }
  return { ok: true, orderNos }
}

// ── 마이페이지: 수량 변경 / 취소 ──────────────────────────────
export async function updateMyOrderQtyAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "")
  const quantity = Number(formData.get("quantity") ?? 0)
  if (!orderId || !Number.isInteger(quantity) || quantity < 1) return
  const supabase = await createClient()
  await supabase.rpc("update_my_order_qty", { p_order_id: orderId, p_quantity: quantity })
  revalidatePath("/order/lookup")
}

export async function cancelMyOrderAction(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "")
  if (!orderId) return
  const supabase = await createClient()
  await supabase.rpc("cancel_my_order", { p_order_id: orderId })
  revalidatePath("/order/lookup")
}
