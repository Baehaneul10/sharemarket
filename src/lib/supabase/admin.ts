import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL } from "./config"

// 본사 관리자 전용 — service_role 키 사용. RLS 우회. 절대 클라이언트로 노출 금지.
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  return createSupabaseClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
