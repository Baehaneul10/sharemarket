"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// 고객 로그아웃
export async function customerLogoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
