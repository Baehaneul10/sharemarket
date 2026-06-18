// 표시용 포맷 유틸

export function formatPrice(n: number | null | undefined): string {
  if (n == null) return "-"
  return n.toLocaleString("ko-KR") + "원"
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("ko-KR", {
    year: "numeric", month: "long", day: "numeric", weekday: "short",
  })
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "-"
  const date = typeof d === "string" ? new Date(d) : d
  if (isNaN(date.getTime())) return "-"
  return date.toLocaleString("ko-KR", {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

// 휴대폰 번호 마스킹: 010-1234-5678 → 010-****-5678 (기획서 9장)
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "-"
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 8) return phone
  const last4 = digits.slice(-4)
  const first3 = digits.slice(0, 3)
  return `${first3}-****-${last4}`
}

// 휴대폰 뒤 4자리 (점주 주문 목록용)
export function phoneLast4(phone: string | null | undefined): string {
  if (!phone) return "----"
  const digits = phone.replace(/\D/g, "")
  return digits.slice(-4) || "----"
}

// 한국 휴대폰 번호 형식 검증
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return /^01[016789]\d{7,8}$/.test(digits)
}

// 남은 수량 계산
export function remainingQty(totalQty: number | null, orderedQty: number): number | null {
  if (totalQty == null) return null
  return Math.max(0, totalQty - orderedQty)
}

// 마감 여부
export function isClosed(saleEnd: string): boolean {
  return new Date(saleEnd).getTime() < Date.now()
}
