"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const STORAGE_KEY = "yy_owner_alert"

type Toast = { id: number; text: string }

// 점주 화면용 실시간 신규주문 알림 (소리 + 토스트 + 자동 새로고침).
// orders 테이블에 자기 매장(storeId) 주문이 INSERT/UPDATE되면 반응한다.
// Supabase Realtime 필요: supabase/migration_realtime.sql 실행 + RLS로 본인 매장만 수신.
export function OwnerRealtime({ storeId }: { storeId: string }) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  const audioCtxRef = useRef<AudioContext | null>(null)
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const toastId = useRef(0)

  // 짧은 2-톤 비프음 (에셋 파일 없이 Web Audio로 생성)
  const playBeep = useCallback(() => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const now = ctx.currentTime
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.frequency.value = freq
      const start = now + i * 0.16
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.15)
      osc.connect(gain).connect(ctx.destination)
      osc.start(start)
      osc.stop(start + 0.17)
    })
  }, [])

  // AudioContext 준비/재개 (브라우저 자동재생 정책상 사용자 제스처에서 호출돼야 함)
  const ensureAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      audioCtxRef.current = new Ctx()
    }
    if (audioCtxRef.current.state === "suspended") {
      try { await audioCtxRef.current.resume() } catch { /* 다음 제스처에서 재시도 */ }
    }
  }, [])

  const pushToast = useCallback((text: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, text }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 8000)
  }, [])

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => router.refresh(), 500)
  }, [router])

  // "알림 켜기" 버튼
  const handleEnable = useCallback(async () => {
    await ensureAudio()
    playBeep() // 테스트음
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      try { await Notification.requestPermission() } catch { /* 무시 */ }
    }
    localStorage.setItem(STORAGE_KEY, "1")
    setEnabled(true)
  }, [ensureAudio, playBeep])

  // 실시간 구독
  useEffect(() => {
    // 이전에 켜둔 경우: 표시는 켜짐으로, 오디오는 첫 제스처에서 재개
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setEnabled(true)
      const resume = () => { void ensureAudio() }
      window.addEventListener("pointerdown", resume, { once: true })
    }

    const supabase = createClient()
    let channel: ReturnType<typeof supabase.channel> | null = null

    const onNewOrder = (payload: { new: Record<string, unknown> }) => {
      const o = payload.new
      const text = `🛎️ 새 주문! ${o.product_name ?? "상품"} ${o.quantity ?? ""}개 · ${o.customer_name ?? "고객"}`
      playBeep()
      pushToast(text)
      if (typeof document !== "undefined" && document.visibilityState === "hidden"
        && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try { new Notification("새 주문이 들어왔어요", { body: text }) } catch { /* 무시 */ }
      }
      scheduleRefresh()
    }

    const setup = async () => {
      // RLS가 적용되려면 realtime 소켓에 로그인 토큰을 실어야 함 (안 하면 이벤트가 안 옴)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) supabase.realtime.setAuth(session.access_token)

      channel = supabase
        .channel(`owner-orders-${storeId}`)
        .on("postgres_changes",
          { event: "INSERT", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
          onNewOrder)
        .on("postgres_changes",
          { event: "UPDATE", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
          () => scheduleRefresh())
        .subscribe()
    }
    void setup()

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current)
      if (channel) supabase.removeChannel(channel)
    }
  }, [storeId, ensureAudio, playBeep, pushToast, scheduleRefresh])

  return (
    <>
      {/* 알림 켜기 안내 (꺼져 있을 때만 눈에 띄게) */}
      {!enabled ? (
        <div className="mx-auto w-full max-w-screen-md px-4 pt-3">
          <button
            onClick={handleEnable}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-100"
          >
            🔔 새 주문 알림 켜기 (한 번 눌러주세요)
          </button>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-screen-md px-4 pt-2 text-right">
          <span className="text-xs text-emerald-600">🔔 실시간 알림 켜짐</span>
        </div>
      )}

      {/* 신규주문 토스트 */}
      {toasts.length > 0 && (
        <div className="fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4">
          {toasts.map((t) => (
            <div
              key={t.id}
              className="w-full max-w-screen-md rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
            >
              {t.text}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
