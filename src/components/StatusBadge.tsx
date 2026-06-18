import { ORDER_STATUS } from "@/lib/constants"
import type { OrderStatus } from "@/types/db"

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = ORDER_STATUS[status] ?? ORDER_STATUS.received
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>
      {s.label}
    </span>
  )
}
