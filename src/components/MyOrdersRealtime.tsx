"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

// 마이페이지: 내 주문 상태가 바뀌면(점주가 입고/픽업완료 처리 등) 실시간 자동 갱신
export function MyOrdersRealtime({ userId }: { userId: string }) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setup = async () => {
      // RLS 적용을 위해 로그인 토큰 주입 (본인 주문만 수신)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) supabase.realtime.setAuth(session.access_token)
      channel = supabase
        .channel(`my-orders-${userId}`)
        .on("postgres_changes",
          { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` },
          () => {
            if (timer.current) clearTimeout(timer.current)
            timer.current = setTimeout(() => router.refresh(), 400)
          })
        .subscribe()
    }
    void setup()

    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [userId, router])

  return null
}
