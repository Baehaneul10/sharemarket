import { requireAdmin } from "@/lib/auth"

// 상품 일괄등록용 CSV 양식 다운로드 (헤더 + 예시 1줄)
export async function GET() {
  await requireAdmin()

  const headers = [
    "상품명", "카테고리", "정상가", "공동구매가", "매장공급가", "재고",
    "1인최대수량", "보관방식", "원산지", "유통기한", "알레르기", "구성", "상품설명", "노출",
  ]
  const example = [
    "오곡 미숫가루 1kg", "간식", "15000", "9900", "7000", "30",
    "3", "실온", "국내산", "제조일+12개월", "대두", "미숫가루 1kg", "고소한 국산 미숫가루", "Y",
  ]
  const cell = (c: string) => `"${c.replace(/"/g, '""')}"`
  const csv = [headers, example].map((r) => r.map(cell).join(",")).join("\r\n")
  const body = "﻿" + csv // Excel 한글 깨짐 방지

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="product_template.csv"`,
    },
  })
}
