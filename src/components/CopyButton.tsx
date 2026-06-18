"use client"

import { useState } from "react"

export function CopyButton({
  text,
  label = "복사하기",
  className = "",
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 클립보드 API 미지원 환경 fallback
      window.prompt("아래 내용을 복사하세요", text)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 ${className}`}
    >
      {copied ? "✓ 복사됨" : label}
    </button>
  )
}
