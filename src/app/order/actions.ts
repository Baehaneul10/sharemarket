"use server"

import { createClient } from "@/lib/supabase/server"
import { isSupabaseConfigured } from "@/lib/supabase/config"
import { isValidPhone, phoneLast4 } from "@/lib/format"

export type CreateOrderResult =
  | { ok: true; orderNo: string; last4: string }
  | { ok: false; error: string }

export async function createOrderAction(
  _prev: CreateOrderResult | null,
  formData: FormData
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, error: "서버가 아직 Supabase에 연결되지 않았습니다. (.env.local 설정 필요)" }
  }

  const groupBuyId = String(formData.get("group_buy_id") ?? "")
  const storeId = String(formData.get("store_id") ?? "")
  const customerName = String(formData.get("customer_name") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim()
  const quantity = Number(formData.get("quantity") ?? 0)
  const requestNote = String(formData.get("request_note") ?? "").trim()
  const privacyAgreed = formData.get("privacy_agreed") === "on"

  if (!groupBuyId || !storeId) return { ok: false, error: "공구/매장 정보가 올바르지 않습니다." }
  if (!customerName) return { ok: false, error: "고객명을 입력해주세요." }
  if (!isValidPhone(phone)) return { ok: false, error: "휴대폰 번호 형식이 올바르지 않습니다." }
  if (!Number.isInteger(quantity) || quantity < 1) return { ok: false, error: "수량을 확인해주세요." }
  if (!privacyAgreed) return { ok: false, error: "개인정보 수집 동의가 필요합니다." }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc("create_order", {
    p_group_buy_id: groupBuyId,
    p_store_id: storeId,
    p_customer_name: customerName,
    p_phone: phone,
    p_quantity: quantity,
    p_request_note: requestNote || null,
    p_privacy_agreed: privacyAgreed,
  })

  if (error) return { ok: false, error: error.message || "주문 처리 중 오류가 발생했습니다." }

  const order = Array.isArray(data) ? data[0] : data
  if (!order?.order_no) return { ok: false, error: "주문 생성에 실패했습니다." }

  return { ok: true, orderNo: order.order_no as string, last4: phoneLast4(phone) }
}
