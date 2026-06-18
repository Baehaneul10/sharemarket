import { BRAND, BRAND_OPENCHAT } from "@/lib/constants"

export function OpenChatButton({ url, className = "" }: { url?: string | null; className?: string }) {
  const href = url || BRAND_OPENCHAT
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl bg-yellow-400 px-4 py-3 text-center font-semibold text-gray-900 hover:bg-yellow-300 ${className}`}
    >
      💬 {BRAND} 공구방 입장하기
    </a>
  )
}
