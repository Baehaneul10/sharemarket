import Link from "next/link"
import { CATEGORIES } from "@/lib/constants"

export function CategoryTabs({ active }: { active?: string }) {
  const base = "whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium border transition-colors"
  const on = "border-blue-600 bg-blue-600 text-white"
  const off = "border-gray-200 bg-white text-gray-600"
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      <Link href="/" className={`${base} ${!active ? on : off}`}>전체</Link>
      {CATEGORIES.map((c) => (
        <Link
          key={c}
          href={`/?cat=${encodeURIComponent(c)}`}
          className={`${base} ${active === c ? on : off}`}
        >
          {c}
        </Link>
      ))}
    </div>
  )
}
