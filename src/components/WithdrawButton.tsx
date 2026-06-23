"use client"

import { useState } from "react"
import { deleteMyAccountAction } from "@/app/auth/actions"

// 마이페이지 하단 회원 탈퇴 — 새 창이 아닌 확인 팝업
export function WithdrawButton() {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 underline-offset-2 hover:text-gray-600 hover:underline"
      >
        회원 탈퇴
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6" onClick={() => setOpen(false)}>
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="text-sm leading-relaxed text-gray-700">
              회원 탈퇴 시 계정 정보와 개인정보가 삭제되며 복구할 수 없습니다.
            </p>
            <p className="mt-3 font-semibold text-gray-900">정말 탈퇴하시겠습니까?</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="flex-1 rounded-xl border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <form action={deleteMyAccountAction} onSubmit={() => setPending(true)} className="flex-1">
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-xl bg-red-600 py-2.5 font-semibold text-white hover:bg-red-700 disabled:bg-gray-300"
                >
                  {pending ? "처리 중..." : "탈퇴하기"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
