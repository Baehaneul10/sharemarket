"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, userId: user?.id ?? null }
}

// 입고 완료 처리
export async function markIncomingAction(formData: FormData) {
  const id = String(formData.get("order_id"))
  const { supabase } = await getUserId()
  await supabase.from("orders").update({ status: "incoming" }).eq("id", id)
  revalidatePath(`/owner/orders/${id}`)
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 픽업 완료 처리 (기획서 5-5)
export async function pickupCompleteAction(formData: FormData) {
  const id = String(formData.get("order_id"))
  const paid = formData.get("paid") === "on"
  const receivedQtyRaw = formData.get("received_qty")
  const receivedQty = receivedQtyRaw ? Number(receivedQtyRaw) : null
  const memo = String(formData.get("memo") ?? "").trim() || null
  const { supabase, userId } = await getUserId()
  await supabase
    .from("orders")
    .update({
      status: "picked_up",
      picked_up_at: new Date().toISOString(),
      handled_by: userId,
      paid,
      received_qty: receivedQty,
      memo,
    })
    .eq("id", id)
  revalidatePath(`/owner/orders/${id}`)
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 취소 처리
export async function cancelOrderAction(formData: FormData) {
  const id = String(formData.get("order_id"))
  const reason = String(formData.get("cancel_reason") ?? "").trim() || null
  const { supabase } = await getUserId()
  await supabase.from("orders").update({ status: "canceled", cancel_reason: reason }).eq("id", id)
  revalidatePath(`/owner/orders/${id}`)
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 미수령 처리 (기획서 5-6)
export async function noShowAction(formData: FormData) {
  const id = String(formData.get("order_id"))
  const reason = String(formData.get("no_show_reason") ?? "").trim() || null
  const { supabase } = await getUserId()
  await supabase.from("orders").update({ status: "no_show", no_show_reason: reason }).eq("id", id)
  revalidatePath(`/owner/orders/${id}`)
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 여러 주문 일괄 입고완료 (오늘 픽업 체크리스트용)
export async function bulkMarkIncomingAction(formData: FormData) {
  const ids = formData.getAll("order_ids").map(String).filter(Boolean)
  if (ids.length === 0) { revalidatePath("/owner/pickup"); return }
  const { supabase } = await getUserId()
  // RLS로 본인 매장 주문만 갱신됨. received 상태만 입고완료로.
  await supabase.from("orders").update({ status: "incoming" }).in("id", ids).eq("status", "received")
  revalidatePath("/owner/pickup")
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 여러 주문 일괄 픽업완료 (현장결제 완료 가정)
export async function bulkPickupCompleteAction(formData: FormData) {
  const ids = formData.getAll("order_ids").map(String).filter(Boolean)
  if (ids.length === 0) { revalidatePath("/owner/pickup"); return }
  const { supabase, userId } = await getUserId()
  await supabase.from("orders")
    .update({ status: "picked_up", picked_up_at: new Date().toISOString(), handled_by: userId, paid: true })
    .in("id", ids)
    .in("status", ["received", "incoming"])
  revalidatePath("/owner/pickup")
  revalidatePath("/owner/orders")
  revalidatePath("/owner")
}

// 여러 주문 일괄 취소
export async function bulkCancelAction(formData: FormData) {
  const ids = formData.getAll("order_ids").map(String).filter(Boolean)
  if (ids.length === 0) { revalidatePath("/owner/orders"); return }
  const { supabase } = await getUserId()
  await supabase.from("orders")
    .update({ status: "canceled", cancel_reason: "점주 취소" })
    .in("id", ids)
    .in("status", ["received", "incoming"])
  revalidatePath("/owner/orders")
  revalidatePath("/owner/pickup")
  revalidatePath("/owner")
}

export async function ownerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/owner/login")
}
