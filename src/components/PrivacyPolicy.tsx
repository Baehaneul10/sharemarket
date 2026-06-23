"use client"

import { useEffect, useState } from "react"
import { PRIVACY_POLICY } from "@/lib/company"

// "개인정보 처리방침" 클릭 → 새 창이 아닌 팝업(모달)로 전문 표시
export function PrivacyPolicy() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-semibold text-gray-600 underline-offset-2 hover:underline"
      >
        개인정보 처리방침
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="font-bold text-gray-900">개인정보 처리방침</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="닫기" className="text-xl leading-none text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-700">{PRIVACY_POLICY}</p>
            </div>
            <div className="border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
