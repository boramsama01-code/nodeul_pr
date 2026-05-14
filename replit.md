# 노들섬 홍보 통합 시스템

노들섬(서울) 홍보 워크플로우 관리 웹 앱. 16비트 레트로 GBC/NES 게임 미학을 갖춘 홍보 신청부터 승인, 홍보물 제출, 수정, 최종 승인, 게시 일정 관리까지 지원합니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk Auth (proxy middleware)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Frontend: React + Vite + Wouter + TanStack Query + Framer Motion
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — Full API specification (source of truth)
- `lib/db/src/schema/` — All DB table definitions
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/nodeul-pr/src/` — React frontend
- `artifacts/nodeul-pr/src/pages/` — Pages (Dashboard, Events, Admin)
- `artifacts/nodeul-pr/src/components/pixel/` — Retro UI components

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval → React Query hooks + Zod schemas
- Clerk Auth with proxy middleware for session cookie authentication (web)
- Role-based access: `user`, `admin`, `super_admin` stored in DB + Clerk publicMetadata
- 16-bit pixel art CSS theme: Press Start 2P + VT323 fonts, scanlines, CRT effect
- NPC helper (맹꽁이 🐸) JRPG-style text box for contextual guidance
- Email via Resend API (onboarding@resend.dev) with disclaimer footer to nodeul@sfac.or.kr

## Product

**홍보 워크플로우**: 홍보 신청 → 승인 → 홍보물 제출 → 수정 반복 → 최종 승인 → 게시 일정 관리

**User features**:
- 이벤트 생성 및 홍보 신청 (Quest Log 대시보드)
- 홍보 구역 신청 (인스타그램, 야외 전광판, 홈페이지 배너, 현장 사이니지, 기타)
- 홍보물 업로드 및 버전 관리
- 코멘트 작성 및 타임라인 확인

**Admin features**:
- Admin HUD 대시보드 (통계, 오늘의 일정, 충돌 감지)
- 전체 이벤트 목록 및 상태별 필터링
- 홍보 신청 승인/반려/수정 요청
- 이메일 발송 (Resend API)

## User preferences

- 16-bit 레트로 GBC/NES 게임 미학 유지
- 한국어 UI, Press Start 2P + VT323 폰트
- NPC 도우미 (🐸 맹꽁이) 항상 표시

## Gotchas

- `pnpm run typecheck:libs` must be run after changing `lib/db/src/schema/` before API server typecheck
- API mutations use `data` (not `body`) in TanStack Query v5 + Orval pattern
- TanStack Query v5: `queryKey` is required in `UseQueryOptions` — use `getXxxQueryKey()` helper
- `@clerk/react@6` required for compatibility with `@clerk/express@2` (same @clerk/shared major)
- Email: RESEND_API_KEY secret needed for real delivery; falls back to "sent" status if absent

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See the `clerk-auth` skill for Clerk setup and proxy configuration
