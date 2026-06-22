import Link from "next/link"
import { ownerLogoutAction } from "@/app/owner/actions"
import { BackButton } from "@/components/BackButton"

export function OwnerHeader({ storeName }: { storeName: string }) {
  return (
    <header className="bg-gray-900 px-4 py-3 text-white">
      <div className="mx-auto flex max-w-screen-md items-center justify-between">
        <div className="flex items-center gap-3">
          <BackButton />
          <Link href="/owner" prefetch={false} className="font-bold">{storeName}</Link>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/owner/pickup" prefetch={false} className="text-gray-300 hover:text-white">오늘픽업</Link>
          <Link href="/owner/orders" prefetch={false} className="text-gray-300 hover:text-white">주문</Link>
          <form action={ownerLogoutAction}>
            <button type="submit" className="text-gray-400 hover:text-white">로그아웃</button>
          </form>
        </nav>
      </div>
    </header>
  )
}
