import { notFound } from "next/navigation"
import { getStoreBySlug } from "@/lib/queries"
import { StoreHome } from "@/components/StoreHome"

// 매장별 진입 주소 (예: /s/pangyo) — slug로 매장을 찾아 카탈로그를 보여준다.
// 쿠키 고정은 proxy.ts 에서 처리(이후 깊은 페이지 이동용).
export default async function StoreSlugPage(props: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ cat?: string }>
}) {
  const { slug } = await props.params
  const { cat } = await props.searchParams
  const store = await getStoreBySlug(slug)
  if (!store) notFound()
  return <StoreHome store={store} cat={cat} />
}
