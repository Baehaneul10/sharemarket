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

export async function ownerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/owner/login")
}
