import Link from "next/link"
import { adminLogoutAction } from "@/app/admin/actions"
import { BackButton } from "@/components/BackButton"

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/orders", label: "주문 취합" },
  { href: "/admin/products", label: "상품" },
  { href: "/admin/group-buys", label: "공구" },
  { href: "/admin/stores", label: "매장" },
]

export function AdminHeader() {
  return (
    <header className="bg-gray-900 text-white">
      <div className="mx-auto flex max-w-screen-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <BackButton />
          <Link href="/admin" prefetch={false} className="font-bold">영영상점 관리자</Link>
        </div>
        <form action={adminLogoutAction}>
          <button type="submit" className="text-sm text-gray-400 hover:text-white">로그아웃</button>
        </form>
      </div>
      <nav className="mx-auto flex max-w-screen-lg gap-4 overflow-x-auto px-4 pb-2 text-sm">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} prefetch={false} className="whitespace-nowrap text-gray-300 hover:text-white">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
