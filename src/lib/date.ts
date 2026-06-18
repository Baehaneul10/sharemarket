// 오늘 날짜를 Asia/Seoul 기준 YYYY-MM-DD 로 반환 (DB의 date 컬럼과 비교용)
export function todaySeoul(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
}
