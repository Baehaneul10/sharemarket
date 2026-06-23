import type { OrderStatus } from "@/types/db"

// 상품 카테고리 (기획서 4-2)
export const CATEGORIES = [
  "밀키트", "반찬", "간식", "축산", "수산", "생활", "특가",
] as const

// 주문 상태 라벨 + 색상 (기획서 8장 MVP 5단계)
export const ORDER_STATUS: Record<OrderStatus, { label: string; badge: string }> = {
  received:  { label: "주문 접수", badge: "bg-gray-100 text-gray-700" },
  incoming:  { label: "입고 완료", badge: "bg-blue-100 text-blue-700" },
  picked_up: { label: "픽업 완료", badge: "bg-emerald-100 text-emerald-700" },
  canceled:  { label: "취소",     badge: "bg-red-100 text-red-700" },
  no_show:   { label: "미수령",    badge: "bg-orange-100 text-orange-700" },
}

// 미수령 사유 (기획서 5-6)
export const NO_SHOW_REASONS = [
  "고객 연락 안 됨", "방문 예정일 변경 요청", "단순 미방문", "주문 취소 요청", "기타",
] as const

// 표준 안내 문구 (기획서 14장)
export const COPY = {
  mainBanner: "오늘 주문하면 D+2에 가까운 매장에서 픽업할 수 있어요.\n결제는 상품 수령 시 매장에서 진행됩니다.",
  beforeOrder: "본 상품은 예약 주문 상품입니다.\n주문 마감 후에는 취소가 어려울 수 있으니 픽업 일정과 매장을 꼭 확인해주세요.",
  orderComplete: "주문이 정상 접수되었습니다.\n상품은 선택하신 매장에서 픽업 가능합니다.\n픽업 일정과 입고 안내는 오픈채팅방을 통해 공지됩니다.",
  payAtStore: "온라인 결제는 진행되지 않습니다.\n상품 수령 시 매장에서 결제해주세요.",
  privacy: "주문 확인 및 픽업 안내를 위해 이름, 휴대폰 번호, 픽업 매장 정보를 수집합니다.\n수집된 정보는 주문 처리 및 고객 안내 목적으로만 사용됩니다.",
  requestNote: "요청사항은 매장 상황에 따라 반영이 어려울 수 있습니다.",
} as const

export const BRAND = "영영상점"
export const BRAND_OPENCHAT = "https://open.kakao.com/o/test" // 전체 공구방 (추후 교체)
