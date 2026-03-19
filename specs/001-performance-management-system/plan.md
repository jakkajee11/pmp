# Implementation Plan: Performance Metrics Portal

**Branch**: `001-performance-management-system` | **Date**: 2026-03-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-performance-management-system/spec.md`

## Summary

Build a web-based Performance Metrics Portal (PMP) to modernize the annual performance review process. The system replaces manual Excel-based workflows with a digital platform supporting self-evaluations, manager reviews, weighted scoring (KPI 80% + Core Values 20%), and comprehensive audit trails. Target: 500-2,000 employees, October 2026 launch.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: Next.js 14.x (App Router), React 18.x, Prisma 5.x
**Storage**: PostgreSQL 15.x (primary database), Amazon S3 (file uploads)
**Testing**: Jest (unit tests), Playwright (E2E tests), 80% minimum coverage
**Target Platform**: Web application on OpenShift Container Platform
**Project Type**: Web application (full-stack Next.js)
**Performance Goals**: <2s page load, 500 concurrent users, 30s auto-save interval
**Constraints**: 99.9% uptime during review periods, PDPA compliance, 5-year audit log retention, TLS 1.3+
**Scale/Scope**: 500-2,000 employees, 5-10 objectives per employee per cycle, 2 review cycles/year

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Phase 0 Check

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Test-First Development | ✅ PASS | TDD workflow defined in spec; 80% coverage requirement; E2E tests for critical journeys |
| II. Security & Privacy First | ✅ PASS | PDPA compliance specified; OWASP controls in requirements; audit logging for all CRUD |
| III. Code Quality Standards | ✅ PASS | TypeScript strict mode; ESLint/Prettier configured; PR approval required |
| IV. Observability & Auditability | ✅ PASS | Pino structured logging; 5-year audit retention; no PII in logs |
| V. Simplicity & YAGNI | ✅ PASS | Fixed tech stack (Next.js, TypeScript, PostgreSQL, S3); no experimental packages |

**Gate Status**: ✅ ALL GATES PASSED - Proceed to Phase 0

### Post-Phase 1 Re-Check

| Principle | Status | Design Evidence |
|-----------|--------|-----------------|
| I. Test-First Development | ✅ PASS | Jest/Playwright configured; tests co-located with features; 80% coverage in CI gates |
| II. Security & Privacy First | ✅ PASS | AuditLog entity with 5-year retention; no PII in JSONB fields; S3 presigned URLs with expiration |
| III. Code Quality Standards | ✅ PASS | Prisma schema with strict types; API contracts define validation rules; PR under 400 lines enforced |
| IV. Observability & Auditability | ✅ PASS | AuditLog entity tracks old/new values; Pino structured logging in shared lib; IP address logging |
| V. Simplicity & YAGNI | ✅ PASS | Feature-based structure reduces coupling; in-memory queue (no Redis); Prisma over custom ORM |

**Post-Design Gate Status**: ✅ ALL GATES PASSED

## Project Structure

### Documentation (this feature)

```text
specs/001-performance-management-system/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root) - Feature-Based Structure

```text
src/
├── app/                          # Next.js App Router (thin routing layer)
│   ├── (auth)/                   # Auth-protected routes group
│   │   ├── layout.tsx            # Auth layout with session check
│   │   ├── page.tsx              # Dashboard entry
│   │   ├── dashboard/
│   │   │   └── page.tsx          # Re-exports from features/dashboard
│   │   ├── evaluations/
│   │   │   └── page.tsx          # Re-exports from features/evaluations
│   │   ├── objectives/
│   │   │   └── page.tsx          # Re-exports from features/objectives
│   │   ├── cycles/
│   │   │   └── page.tsx          # Re-exports from features/cycles
│   │   ├── users/
│   │   │   └── page.tsx          # Re-exports from features/users
│   │   ├── reports/
│   │   │   └── page.tsx          # Re-exports from features/reports
│   │   ├── audit-logs/
│   │   │   └── page.tsx          # Re-exports from features/audit-logs
│   │   ├── settings/
│   │   │   └── page.tsx          # Re-exports from features/settings
│   │   └── org-chart/
│   │       └── page.tsx          # Re-exports from features/org-chart
│   ├── api/                      # API routes (thin routing layer)
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── users/route.ts        # Re-exports from features/users
│   │   ├── cycles/route.ts       # Re-exports from features/cycles
│   │   ├── objectives/route.ts   # Re-exports from features/objectives
│   │   ├── evaluations/route.ts  # Re-exports from features/evaluations
│   │   ├── notifications/route.ts
│   │   ├── documents/route.ts
│   │   ├── reports/route.ts
│   │   └── audit-logs/route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css
│
├── features/                     # Feature modules (business logic)
│   ├── auth/                     # Authentication feature
│   │   ├── api/
│   │   │   ├── handlers.ts       # Auth API handlers
│   │   │   └── session.ts        # Session utilities
│   │   ├── components/
│   │   │   ├── login-form.tsx
│   │   │   └── session-provider.tsx
│   │   ├── hooks/
│   │   │   └── use-session.ts
│   │   ├── types.ts
│   │   └── index.ts              # Public exports
│   │
│   ├── users/                    # User management feature
│   │   ├── api/
│   │   │   ├── handlers.ts       # CRUD handlers
│   │   │   ├── bulk-import.ts    # CSV import logic
│   │   │   └── validators.ts     # Request validation
│   │   ├── components/
│   │   │   ├── user-form.tsx
│   │   │   ├── user-list.tsx
│   │   │   ├── user-import-dialog.tsx
│   │   │   └── role-badge.tsx
│   │   ├── hooks/
│   │   │   ├── use-users.ts
│   │   │   └── use-user-mutations.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── cycles/                   # Review cycle management
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   ├── validators.ts
│   │   │   └── deadline-jobs.ts  # Scheduled jobs
│   │   ├── components/
│   │   │   ├── cycle-form.tsx
│   │   │   ├── cycle-list.tsx
│   │   │   ├── deadline-config.tsx
│   │   │   └── cycle-status-badge.tsx
│   │   ├── hooks/
│   │   │   ├── use-cycles.ts
│   │   │   └── use-active-cycle.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── objectives/               # Objective assignment
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   ├── bulk-assign.ts
│   │   │   └── validators.ts
│   │   ├── components/
│   │   │   ├── objective-form.tsx
│   │   │   ├── objective-card.tsx
│   │   │   ├── rating-criteria-editor.tsx
│   │   │   └── bulk-assign-dialog.tsx
│   │   ├── hooks/
│   │   │   ├── use-objectives.ts
│   │   │   └── use-objective-mutations.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── evaluations/              # Self-eval & Manager review (CORE)
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   ├── validators.ts
│   │   │   └── scoring.ts        # Weighted score calculation
│   │   ├── components/
│   │   │   ├── self-eval-form.tsx
│   │   │   ├── manager-review-form.tsx
│   │   │   ├── rating-slider.tsx
│   │   │   ├── score-display.tsx
│   │   │   ├── evaluation-status.tsx
│   │   │   └── auto-save-indicator.tsx
│   │   ├── hooks/
│   │   │   ├── use-evaluation.ts
│   │   │   ├── use-auto-save.ts
│   │   │   └── use-scoring.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── core-values/              # Core values assessment
│   │   ├── api/
│   │   │   └── handlers.ts
│   │   ├── components/
│   │   │   ├── core-value-form.tsx
│   │   │   ├── core-value-rating.tsx
│   │   │   └── core-value-list.tsx
│   │   ├── hooks/
│   │   │   └── use-core-values.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── dashboard/                # Role-based dashboards
│   │   ├── components/
│   │   │   ├── employee-dashboard.tsx
│   │   │   ├── manager-dashboard.tsx
│   │   │   ├── hr-dashboard.tsx
│   │   │   ├── completion-chart.tsx
│   │   │   └── status-summary.tsx
│   │   ├── hooks/
│   │   │   └── use-dashboard-data.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── reports/                  # Reports & exports
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   ├── csv-export.ts
│   │   │   └── pdf-generator.ts
│   │   ├── components/
│   │   │   ├── completion-report.tsx
│   │   │   ├── rating-distribution-chart.tsx
│   │   │   ├── report-filters.tsx
│   │   │   └── export-dialog.tsx
│   │   ├── hooks/
│   │   │   └── use-reports.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── notifications/            # Notification system
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   └── queue.ts         # In-memory notification queue
│   │   ├── services/
│   │   │   ├── email.ts         # SMTP service
│   │   │   ├── sms.ts           # SMS webhook
│   │   │   └── teams.ts         # MS Teams webhook
│   │   ├── components/
│   │   │   ├── notification-bell.tsx
│   │   │   ├── notification-list.tsx
│   │   │   └── notification-settings.tsx
│   │   ├── hooks/
│   │   │   └── use-notifications.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── documents/                # File uploads
│   │   ├── api/
│   │   │   ├── handlers.ts
│   │   │   └── s3-service.ts    # S3 presigned URLs
│   │   ├── components/
│   │   │   ├── file-upload.tsx
│   │   │   ├── file-list.tsx
│   │   │   └── file-preview.tsx
│   │   ├── hooks/
│   │   │   └── use-file-upload.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── audit-logs/               # Audit trail viewing
│   │   ├── api/
│   │   │   └── handlers.ts
│   │   ├── components/
│   │   │   ├── audit-log-table.tsx
│   │   │   ├── audit-log-filters.tsx
│   │   │   └── change-diff.tsx   # Shows old vs new values
│   │   ├── hooks/
│   │   │   └── use-audit-logs.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── org-chart/                # Organization visualization
│   │   ├── api/
│   │   │   └── handlers.ts
│   │   ├── components/
│   │   │   ├── org-tree.tsx      # React Flow component
│   │   │   ├── org-node.tsx
│   │   │   └── department-filter.tsx
│   │   ├── hooks/
│   │   │   └── use-org-data.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── settings/                 # User preferences
│       ├── api/
│       │   └── handlers.ts
│       ├── components/
│       │   ├── language-selector.tsx
│       │   └── notification-preferences.tsx
│       ├── hooks/
│       │   └── use-settings.ts
│       ├── types.ts
│       └── index.ts
│
├── shared/                       # Shared utilities (no business logic)
│   ├── api/
│   │   ├── response.ts           # Standard API response helpers
│   │   ├── errors.ts             # Error classes and codes
│   │   └── middleware.ts         # Auth, RBAC, logging middleware
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── data-table.tsx
│   │   ├── loading.tsx
│   │   └── error-boundary.tsx
│   ├── hooks/
│   │   ├── use-debounce.ts
│   │   └── use-local-storage.ts
│   ├── lib/
│   │   ├── db.ts                 # Prisma client singleton
│   │   ├── logger.ts             # Pino logger
│   │   ├── audit.ts              # Audit logging utility
│   │   └── i18n.ts               # next-intl configuration
│   ├── types/
│   │   ├── common.ts             # Shared types (Pagination, etc.)
│   │   └── api.ts                # API response types
│   └── utils/
│       ├── date.ts               # Date formatting utilities
│       ├── validation.ts         # Zod schemas
│       └── constants.ts          # App-wide constants
│
├── messages/                     # i18n translations
│   ├── en.json
│   └── th.json
│
├── middleware.ts                 # Auth & i18n middleware
│
└── env.ts                        # Environment variable validation

prisma/
├── schema.prisma                 # Database schema
└── migrations/                   # Migration files

tests/
├── unit/                         # Unit tests (co-located option)
│   └── features/
│       ├── evaluations/
│       │   └── scoring.test.ts
│       └── notifications/
│           └── queue.test.ts
├── integration/                  # API integration tests
│   └── features/
│       ├── users/
│       │   └── users-api.test.ts
│       └── evaluations/
│           └── evaluations-api.test.ts
└── e2e/                          # Playwright E2E tests
    ├── self-evaluation.spec.ts
    ├── manager-review.spec.ts
    └── cycle-management.spec.ts
```

**Structure Decision**: Feature-based modular architecture where each business domain is self-contained with its own API, components, hooks, and types. The `app/` directory acts as a thin routing layer that re-exports from features. Shared utilities are in `shared/` with no business logic. This approach:

1. **Improves maintainability** - Changes to one feature don't affect others
2. **Enables team ownership** - Teams can own entire feature modules
3. **Reduces merge conflicts** - Developers work in isolated feature directories
4. **Supports scaling** - Easy to add new features without restructuring
5. **Follows Constitution Principle V** - Simplicity through clear boundaries

## Feature Module Pattern

Each feature follows this internal structure:

```text
features/[feature-name]/
├── api/              # Server-side logic (handlers, services, validators)
├── components/       # React components specific to this feature
├── hooks/            # Custom React hooks for this feature
├── types.ts          # TypeScript types and Zod schemas
└── index.ts          # Public API - only export what other features need
```

**Rules**:
- Features can import from `shared/`
- Features should NOT import from other features directly
- Cross-feature communication via `shared/types` or API calls
- Keep `index.ts` minimal - prefer explicit imports

## UI/UX Design Guidelines

**Skill**: Use `ui-ux-pro-max` skill for all UI/UX design tasks.
**Design Style**: **Professional Corporate** - Enterprise-grade, trustworthy, and polished.

When implementing UI components, dashboards, forms, and visual elements, leverage the `ui-ux-pro-max` skill with the following professional corporate style specifications:

### Professional Corporate Style Specification

| Attribute | Specification |
|-----------|---------------|
| **Color Palette** | Navy blue primary (#1e3a5f), slate gray accents, white backgrounds, subtle gradients |
| **Typography** | Clean sans-serif (Inter, system-ui), clear hierarchy, professional tone |
| **Layout** | Generous whitespace, clear sections, card-based organization |
| **Components** | Subtle shadows, rounded corners (sm/md), refined borders |
| **Interactions** | Smooth transitions, clear hover states, professional animations |
| **Data Density** | Balanced - readable tables, scannable dashboards |
| **Branding** | Subtle corporate identity, consistent iconography |

### Visual Characteristics

- **Trustworthy**: Professional color scheme conveying reliability and competence
- **Clean**: Minimal clutter, purposeful white space, organized information
- **Accessible**: High contrast ratios, clear visual hierarchy
- **Enterprise-Ready**: Suitable for corporate environment, stakeholder presentations

### Tasks Using UI/UX Design Skill

The following task categories should use the `ui-ux-pro-max` skill with **Professional Corporate** style:

| Category | Example Tasks |
|----------|---------------|
| **Dashboard Components** | T185-T187 (Employee/HR Dashboard, CompletionChart) |
| **Form Components** | T047, T068, T084, T102, T116, T127 (all *-form.tsx) |
| **Data Visualization** | T057-T058 (OrgTree), T150 (RatingDistributionChart), T187 (CompletionChart) |
| **List/Table Components** | T048, T069, T140, T158 (data tables, lists) |
| **Interactive Components** | T103 (RatingSlider), T139 (NotificationBell), T181 (LanguageSelector) |
| **Status/Display Components** | T046, T071, T105, T117 (badges, indicators, displays) |
| **Dialog/Modal Components** | T049, T087, T141, T152 (dialogs, modals) |
| **Layout & Navigation** | T006-T007, T188-T190 (layouts, loading states, error boundaries) |

### Design Principles

1. **Consistency**: All components follow shadcn/ui patterns and Tailwind CSS conventions
2. **Accessibility**: WCAG 2.1 AA compliance for all interactive elements
3. **Responsiveness**: Mobile-first design, tested at 320px-1920px viewports
4. **Performance**: Lazy loading for heavy components (charts, org tree)
5. **Internationalization**: All text externalized to messages/en.json and messages/th.json
6. **Professional Polish**: Refined micro-interactions, consistent spacing, corporate aesthetics

## Complexity Tracking

> No violations - feature-based structure aligns with constitutional principles and improves maintainability without over-engineering.
