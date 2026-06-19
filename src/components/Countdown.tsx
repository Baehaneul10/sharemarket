"use client"

import { useEffect, useState } from "react"

// 마감까지 남은 시간 카운트다운 (HH:MM:SS)
// 시간 값은 브라우저에서만 계산해 SSR-클라이언트 불일치(hydration 오류)를 방지한다.
export function Countdown({ deadline }: { deadline: string }) {
  const [remain, setRemain] = useState<number | null>(null)

  useEffect(() => {
    const tick = () => setRemain(Math.max(0, new Date(deadline).getTime() - Date.now()))
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [deadline])

  const totalSec = remain == null ? null : Math.floor(remain / 1000)
  const fmt = (n: number) => String(n).padStart(2, "0")
  const h = totalSec == null ? "--" : fmt(Math.floor(totalSec / 3600))
  const m = totalSec == null ? "--" : fmt(Math.floor((totalSec % 3600) / 60))
  const s = totalSec == null ? "--" : fmt(totalSec % 60)

  const Box = ({ v, label }: { v: string; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="rounded-lg bg-white/15 px-2 py-1 text-lg font-bold tabular-nums">{v}</span>
      <span className="mt-0.5 text-[10px] text-sky-100">{label}</span>
    </div>
  )

  return (
    <div className="flex items-center justify-between rounded-2xl bg-blue-800 px-4 py-3 text-white">
      <span className="text-sm font-semibold">⏰ 마감까지 남은시간</span>
      {remain !== null && remain <= 0 ? (
        <span className="font-bold">마감되었습니다</span>
      ) : (
        <div className="flex gap-2">
          <Box v={h} label="시간" />
          <Box v={m} label="분" />
          <Box v={s} label="초" />
        </div>
      )}
    </div>
  )
}
