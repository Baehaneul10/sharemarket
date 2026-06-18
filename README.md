# 영영상점 — 공동구매 픽업 플랫폼

본사가 소싱한 상품을 고객이 온라인으로 예약하고, 가까운 매장에서 **픽업 + 현장 결제**하는 공동구매 플랫폼. (온라인 결제 없음)

- 기술: **Next.js 16 (App Router) + Supabase (Postgres + Auth) + Tailwind CSS v4**
- 화면: 고객 / 점주(`/owner`) / 본사 관리자(`/admin`)

---

## 처음 실행하는 법 (비전공자용)

### 1) Supabase 프로젝트 만들기 (무료)
1. https://supabase.com 가입 → **New Project** (Region: Northeast Asia (Seoul) 권장)
2. 생성 후 **Project Settings → API** 에서 3개 값 복사:
   - Project URL
   - `anon public` key
   - `service_role` key

### 2) 키 입력
프로젝트 폴더의 `.env.local` 파일을 열어 값 3개를 채웁니다.
```
NEXT_PUBLIC_SUPABASE_URL=...        # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...   # anon public key
SUPABASE_SERVICE_ROLE_KEY=...       # service_role key
ADMIN_EMAILS=bt@bluetrend.co.kr     # 본사 관리자로 쓸 이메일 (쉼표로 여러 개 가능)
```

### 3) 데이터베이스 만들기
Supabase 대시보드 → **SQL Editor → New query** 에:
1. `supabase/schema.sql` 전체 붙여넣고 **Run** (테이블·보안·주문번호 자동생성)
2. `supabase/seed.sql` 전체 붙여넣고 **Run** (테스트 매장·상품·공구)

### 4) 로그인 계정 만들기
Supabase 대시보드 → **Authentication → Users → Add user** 로 계정 생성:
- **본사 관리자**: `ADMIN_EMAILS`에 넣은 이메일로 계정 생성 → `/admin/login` 로그인
- **점주**: 점주용 이메일로 계정 생성 → 그 user의 UUID를 복사 → `/admin/stores`에서 해당 매장의 `auth_user_id`에 입력(또는 매장 등록 시 입력) → `/owner/login` 로그인

### 5) 실행
```bash
npm install
npm run dev
```
→ http://localhost:3000

---

## 폴더 구조
```
supabase/schema.sql       DB 스키마 + RLS + 주문번호/주문생성/조회 RPC
supabase/seed.sql         테스트 데이터
src/app/                  페이지 (고객 / owner / admin)
src/components/           공통 UI (상품카드, 상태뱃지, 로그인폼 등)
src/lib/                  supabase 클라이언트, 유틸, 인증, 쿼리
src/types/db.ts           DB 타입
src/proxy.ts              Supabase 세션 갱신 (Next 16: middleware→proxy)
```

## 주요 경로
| 사용자 | 경로 |
|---|---|
| 고객 | `/` 메인 · `/products/[id]` 상세 · `/order/[id]` 주문 · `/order/complete` 완료 · `/order/lookup` 조회 |
| 점주 | `/owner/login` · `/owner` 대시보드 · `/owner/orders` 목록 · `/owner/orders/[id]` 상세·상태변경 |
| 본사 | `/admin/login` · `/admin` 대시보드 · `/admin/orders` 취합·CSV · `/admin/products` · `/admin/group-buys` · `/admin/stores` |

## 배포 (Vercel)
1. 이 폴더를 GitHub에 올리기
2. https://vercel.com 에서 Import → 환경변수 4개(`.env.local` 내용) 입력 → Deploy

> 키 입력 전에도 `npm run dev`로 화면 구조는 확인할 수 있습니다(상품은 빈 목록). 자세한 기획·명세는 상위 폴더의 `영영상점-개발명세서.md` 참고.
