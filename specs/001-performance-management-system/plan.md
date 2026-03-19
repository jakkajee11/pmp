# Implementation Plan: Next.js 16.2.0 Upgrade

**Branch**: `001-performance-management-system` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Framework upgrade request

## Summary

Upgrade Next.js from version 14.2.28 to 16.2.0 to gain access to performance improvements, React 19 support, better Turbopack stability, and security patches. This is a 2-major-version jump requiring careful handling of breaking changes, particularly the async request APIs introduced in Next.js 15.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 14.2.28 → 16.2.0, React 18.3.1 → 19.x, Prisma 5.x, NextAuth.js 5.x
**Storage**: PostgreSQL 15.x with Prisma ORM, Amazon S3 for file uploads
**Testing**: Jest (unit tests), Playwright (E2E tests)
**Target Platform**: OpenShift Container Platform (Linux containers)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: Page load < 3s, API response < 500ms p95
**Constraints**: PDPA compliance (Thai data protection), OWASP Top 10 security
**Scale/Scope**: 500-2000 employees, 15 feature modules

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Test-First Development | ✅ PASS | Existing tests will be updated after migration |
| II. Security & Privacy First | ✅ PASS | No security-related changes; existing CSP/auth patterns preserved |
| III. Code Quality Standards | ✅ PASS | TypeScript strict mode maintained; lint/format checks pass |
| IV. Observability & Auditability | ✅ PASS | No changes to logging/audit systems |
| V. Simplicity & YAGNI | ✅ PASS | Direct upgrade without over-engineering |
| VI. Vertical Slice Architecture | ✅ PASS | Feature structure unchanged |

**Constitution Amendment Required**: Yes - Technology Stack table needs update from Next.js 14.x to 16.x

## Project Structure

### Documentation (this feature)

```text
specs/001-performance-management-system/
├── plan.md              # This file
├── research.md          # Phase 0 output (updated with upgrade research)
├── data-model.md        # Phase 1 output (no changes needed)
├── quickstart.md        # Phase 1 output (may need minor updates)
├── contracts/           # Phase 1 output (no changes needed)
└── tasks.md             # Phase 2 output (add upgrade tasks)
```

### Source Code (repository root)

```text
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Protected routes (13 page modules)
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── cycles/
│   │   ├── objectives/
│   │   ├── evaluations/
│   │   ├── reports/
│   │   ├── audit-logs/
│   │   ├── settings/
│   │   └── org-chart/
│   └── api/                # API routes (REST endpoints)
├── features/               # Feature modules (15 modules)
│   ├── auth/
│   ├── users/
│   ├── cycles/
│   ├── objectives/
│   ├── evaluations/
│   ├── core-values/
│   ├── dashboard/
│   ├── reports/
│   ├── notifications/
│   ├── documents/
│   ├── audit-logs/
│   ├── org-chart/
│   ├── settings/
│   └── localization/
├── shared/                 # Shared utilities
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
└── middleware.ts

tests/
├── unit/features/
├── integration/
└── e2e/
```

**Structure Decision**: Feature-based / Vertical Slice architecture as defined in Constitution Principle VI. No structural changes required for this upgrade.

## Complexity Tracking

> **Constitution Amendment Required**

| Change | Justification |
|--------|---------------|
| Next.js 14.x → 16.x in Technology Stack | Framework upgrade for security patches, performance improvements, and long-term support. Direct upgrade path is supported by Vercel. |

## Upgrade Implementation Plan

### Phase 0: Preparation (Research Complete ✅)

1. **Backup & Branch**
   - Create backup branch: `git checkout -b backup-pre-nextjs16`
   - Work on feature branch: `001-performance-management-system`

2. **Review Breaking Changes**
   - Async Request APIs (cookies, headers, params, searchParams)
   - React 19 compatibility
   - Removed APIs

### Phase 1: Package Updates

1. **Update package.json**
   ```json
   {
     "next": "16.2.0",
     "react": "^19.0.0",
     "react-dom": "^19.0.0"
   }
   ```

2. **Run npm install**
   - Resolve peer dependency conflicts
   - Update related packages if needed

### Phase 2: Code Migration

1. **Run Next.js Codemods**
   ```bash
   npx @next/codemods@latest next-15-async-request-apis .
   ```

2. **Manual Fixes Required**
   - Server Components with params/searchParams
   - API routes using cookies/headers
   - Update middleware if affected

3. **Files Likely Needing Changes**
   - `src/app/(auth)/**/page.tsx` - Server Components
   - `src/app/api/**/route.ts` - API routes
   - `src/middleware.ts` - Middleware
   - `src/features/**/api/*.ts` - Server actions

### Phase 3: Testing & Validation

1. **Run Unit Tests**
   ```bash
   npm test
   ```

2. **Run E2E Tests**
   ```bash
   npm run test:e2e
   ```

3. **Manual QA**
   - Authentication flow
   - Self-evaluation submission
   - Manager review flow
   - File uploads

### Phase 4: Constitution Update

Update `.specify/memory/constitution.md`:
- Technology Stack table: Next.js 14.x → 16.x

### Rollback Plan

If critical issues are found:
```bash
git checkout backup-pre-nextjs16
git checkout -b rollback-nextjs16
```

