"use client"

import { useRouter } from "next/navigation"

// 앱 내부(SPA) 히스토리로 한 단계 뒤로 — 브라우저 '뒤로가기'와 달리
// 폼 재전송(POST) 경고/오류 없이 이전 화면을 다시 렌더한다.
export function BackButton({ className = "" }: { className?: string }) {
  const router = useRouter()
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`text-sm text-gray-300 hover:text-white ${className}`}
    >
      ← 뒤로
    </button>
  )
}
