"use client"

import { useState } from "react"
import Link from "next/link"
import { CATEGORIES } from "@/lib/constants"

export function CategoryTabs({ active }: { active?: string }) {
  const [expanded, setExpanded] = useState(false)
  const base = "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors"
  const on = "border-blue-600 bg-blue-600 text-white"
  const off = "border-gray-200 bg-white text-gray-600"
  const cls = (isOn: boolean) => `${base} ${isOn ? on : off}`

  return (
    <div className="flex items-start gap-2">
      {/* 접힘: 가로 스크롤 / 펼침: 여러 줄로 전체 표시 */}
      <div className={expanded ? "flex flex-1 flex-wrap gap-2" : "flex flex-1 gap-2 overflow-x-auto pb-1"}>
        <Link href="/" className={cls(!active)}>전체</Link>
        {CATEGORIES.map((c) => (
          <Link key={c} href={`/?cat=${encodeURIComponent(c)}`} className={cls(active === c)}>
            {c}
          </Link>
        ))}
      </div>

      {/* 펼치기/접기 토글 */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-label={expanded ? "카테고리 접기" : "카테고리 펼치기"}
        className="shrink-0 rounded-full border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-500 hover:bg-gray-50"
      >
        {expanded ? "▲" : "▼"}
      </button>
    </div>
  )
}
