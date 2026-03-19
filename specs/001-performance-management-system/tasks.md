# Tasks: Performance Metrics Portal

**Feature Branch**: `001-performance-management-system`
**Generated**: 2026-03-19
**Input**: plan.md, spec.md, data-model.md, contracts/api.md

## Task Markers Legend

| Marker | Meaning |
|--------|---------|
| `[P]` | Parallelizable - can run concurrently with other [P] tasks |
| `[US#]` | User Story reference (e.g., [US1], [US2]) |
| `[UI/UX]` | **Use `ui-ux-pro-max` skill with Professional Corporate style** - Navy blue (#1e3a5f), slate gray accents, clean sans-serif typography, enterprise-grade aesthetics |

## Summary

- **Total Tasks**: 198
- **P1 Stories (MVP)**: 5 stories, 108 tasks
- **P2 Stories**: 4 stories, 53 tasks
- **P3 Stories**: 3 stories, 22 tasks
- **Setup + Foundational**: 36 tasks
- **Polish**: 14 tasks
- **Parallel Opportunities**: High within each user story phase
- **UI/UX Style**: Professional Corporate (navy blue primary, clean typography, enterprise-grade)

---

## Phase 1: Setup

**Goal**: Initialize project with Next.js, TypeScript, and development tooling.

### Tasks

- [x] T001 Initialize Next.js 14 project with App Router and TypeScript in repository root
- [x] T002 Configure TypeScript strict mode in tsconfig.json
- [x] T003 [P] Install and configure ESLint with recommended rules
- [x] T004 [P] Install and configure Prettier with project formatting rules
- [x] T005 [P] Create .env.local template with all required environment variables
- [x] T006 [P] [UI/UX] Create src/app/layout.tsx with root layout and metadata (Professional Corporate: Inter font, SEO metadata, semantic structure)
- [x] T007 [P] [UI/UX] Create src/app/globals.css with base styles (Professional Corporate: Navy #1e3a5f primary, slate accents, status colors)
- [x] T008 [P] [UI/UX] Install and initialize shadcn/ui in src/shared/components/ui/ (Professional Corporate: button, card, badge, input, label, separator, skeleton)
- [x] T009 Configure Jest for unit testing with TypeScript support
- [x] T010 Configure Playwright for E2E testing
- [x] T011 Create src/middleware.ts skeleton for auth and i18n
- [x] T012 Create src/env.ts with Zod validation for environment variables
- [x] T013 [P] Create messages/en.json with initial English translations
- [x] T014 [P] Create messages/th.json with initial Thai translations

---

## Phase 2: Foundational

**Goal**: Implement shared infrastructure and database schema required by all user stories.

### Database & Shared Libraries

- [x] T015 Create prisma/schema.prisma with all entities from data-model.md
- [x] T016 Run initial Prisma migration to create database tables
- [x] T017 Create src/shared/lib/db.ts with Prisma client singleton
- [x] T018 [P] Create src/shared/lib/logger.ts with Pino structured logging
- [x] T019 [P] Create src/shared/lib/audit.ts with audit logging utility
- [x] T020 [P] Create src/shared/lib/i18n.ts with next-intl configuration

### Shared API Utilities

- [x] T021 Create src/shared/api/response.ts with success/error response helpers
- [x] T022 [P] Create src/shared/api/errors.ts with error classes and codes
- [x] T023 Create src/shared/api/middleware.ts with auth, RBAC, and logging middleware
- [x] T024 [P] Create src/shared/types/common.ts with Pagination and common types
- [x] T025 [P] Create src/shared/types/api.ts with API response types

### Shared Hooks & Utils

- [x] T026 [P] Create src/shared/hooks/use-debounce.ts with lodash.debounce wrapper
- [x] T027 [P] Create src/shared/hooks/use-local-storage.ts for offline draft storage
- [x] T028 [P] Create src/shared/utils/date.ts with date formatting utilities
- [x] T029 [P] Create src/shared/utils/validation.ts with common Zod schemas
- [x] T030 [P] Create src/shared/utils/constants.ts with app-wide constants

### Authentication Feature

- [x] T031 Create src/features/auth/types.ts with session and user types
- [x] T032 Implement OIDC provider configuration in src/features/auth/api/session.ts
- [x] T033 Create src/features/auth/components/session-provider.tsx for client components
- [x] T034 Create src/features/auth/hooks/use-session.ts for session access
- [x] T035 Create src/features/auth/index.ts with public exports
- [x] T036 Create src/app/api/auth/[...nextauth]/route.ts re-exporting from auth feature

---

## Phase 3: User Story 4 - User & Organization Management (Priority: P1)

**Goal**: Enable HR administrators to manage user accounts and organizational hierarchy.

**Independent Test**: Log in as HR Admin, create users individually and via CSV, assign roles, set up reporting relationships, view org chart.

### Tests for User Story 4

- [x] T037 [P] [US4] Unit test for User entity validation in tests/unit/features/users/
- [x] T038 [P] [US4] Unit test for bulk import CSV parsing in tests/unit/features/users/
- [x] T039 [P] [US4] Integration test for GET /api/users endpoint
- [x] T040 [P] [US4] Integration test for POST /api/users endpoint
- [x] T041 [P] [US4] Integration test for CSV bulk import endpoint

### Implementation for User Story 4

- [x] T042 [P] [US4] Create src/features/users/types.ts with User and Department types and Zod schemas
- [x] T043 [US4] Implement user CRUD handlers in src/features/users/api/handlers.ts
- [x] T044 [US4] Implement bulk CSV import in src/features/users/api/bulk-import.ts
- [x] T045 [US4] Implement request validators in src/features/users/api/validators.ts
- [x] T046 [P] [US4] [UI/UX] Create RoleBadge component in src/features/users/components/role-badge.tsx
- [x] T047 [P] [US4] [UI/UX] Create UserForm component in src/features/users/components/user-form.tsx
- [x] T048 [P] [US4] [UI/UX] Create UserList component with data table in src/features/users/components/user-list.tsx
- [x] T049 [P] [US4] [UI/UX] Create UserImportDialog component in src/features/users/components/user-import-dialog.tsx
- [x] T050 [P] [US4] Create useUsers hook in src/features/users/hooks/use-users.ts
- [x] T051 [P] [US4] Create useUserMutations hook in src/features/users/hooks/use-user-mutations.ts
- [x] T052 [US4] Create src/features/users/index.ts with public exports
- [x] T053 [US4] Create src/app/(auth)/users/page.tsx re-exporting from users feature
- [x] T054 [US4] Create src/app/api/users/route.ts re-exporting from users feature

### Department & Org Chart

- [x] T055 [P] [US4] Create Department types in src/features/users/types.ts
- [x] T056 [US4] Implement department CRUD in src/features/users/api/handlers.ts
- [x] T057 [P] [US4] [UI/UX] Create OrgTree component with React Flow in src/features/org-chart/components/org-tree.tsx
- [x] T058 [P] [US4] [UI/UX] Create OrgNode component in src/features/org-chart/components/org-node.tsx
- [x] T059 [P] [US4] Create useOrgData hook in src/features/org-chart/hooks/use-org-data.ts
- [x] T060 [US4] Create src/features/org-chart/index.ts and src/app/(auth)/org-chart/page.tsx

**Checkpoint**: User Story 4 complete - can create users, import CSV, view org chart

---

## Phase 4: User Story 3 - HR Admin Cycle Configuration (Priority: P1)

**Goal**: Enable HR administrators to configure and manage review cycles.

**Independent Test**: Log in as HR Admin, create review cycle, set deadlines, activate cycle.

### Tests for User Story 3

- [x] T061 [P] [US3] Unit test for ReviewCycle validation in tests/unit/features/cycles/
- [x] T062 [P] [US3] Integration test for POST /api/cycles endpoint
- [x] T063 [P] [US3] Integration test for POST /api/cycles/:id/activate endpoint

### Implementation for User Story 3

- [x] T064 [P] [US4] Create src/features/cycles/types.ts with ReviewCycle types and Zod schemas
- [x] T065 [US3] Implement cycle CRUD handlers in src/features/cycles/api/handlers.ts
- [x] T066 [US3] Implement cycle validators in src/features/cycles/api/validators.ts
- [x] T067 [US3] Implement deadline extension logic in src/features/cycles/api/handlers.ts
- [x] T068 [P] [US3] [UI/UX] Create CycleForm component in src/features/cycles/components/cycle-form.tsx
- [x] T069 [P] [US3] [UI/UX] Create CycleList component in src/features/cycles/components/cycle-list.tsx
- [x] T070 [P] [US3] [UI/UX] Create DeadlineConfig component in src/features/cycles/components/deadline-config.tsx
- [x] T071 [P] [US3] [UI/UX] Create CycleStatusBadge component in src/features/cycles/components/cycle-status-badge.tsx
- [x] T072 [P] [US3] Create useCycles hook in src/features/cycles/hooks/use-cycles.ts
- [x] T073 [P] [US3] Create useActiveCycle hook in src/features/cycles/hooks/use-active-cycle.ts
- [x] T074 [US3] Create src/features/cycles/index.ts with public exports
- [x] T075 [US3] Create src/app/(auth)/cycles/page.tsx re-exporting from cycles feature
- [x] T076 [US3] Create src/app/api/cycles/route.ts re-exporting from cycles feature

**Checkpoint**: User Story 3 complete - can create and activate review cycles

---

## Phase 5: User Story 5 - Objective Assignment (Priority: P1)

**Goal**: Enable managers to create and assign objectives to direct reports.

**Independent Test**: Log in as manager, create objectives for direct reports, verify employees see them.

### Tests for User Story 5

- [x] T077 [P] [US5] Unit test for Objective validation in tests/unit/features/objectives/
- [x] T078 [P] [US5] Integration test for POST /api/objectives endpoint
- [x] T079 [P] [US5] Integration test for POST /api/objectives/bulk endpoint

### Implementation for User Story 5

- [x] T080 [P] [US5] Create src/features/objectives/types.ts with Objective types and Zod schemas
- [x] T081 [US5] Implement objective CRUD handlers in src/features/objectives/api/handlers.ts
- [x] T082 [US5] Implement bulk assignment in src/features/objectives/api/bulk-assign.ts
- [x] T083 [US5] Implement objective validators in src/features/objectives/api/validators.ts
- [x] T084 [P] [US5] [UI/UX] Create ObjectiveForm component in src/features/objectives/components/objective-form.tsx
- [x] T085 [P] [US5] [UI/UX] Create ObjectiveCard component in src/features/objectives/components/objective-card.tsx
- [x] T086 [P] [US5] [UI/UX] Create RatingCriteriaEditor in src/features/objectives/components/rating-criteria-editor.tsx
- [x] T087 [P] [US5] [UI/UX] Create BulkAssignDialog in src/features/objectives/components/bulk-assign-dialog.tsx
- [x] T088 [P] [US5] Create useObjectives hook in src/features/objectives/hooks/use-objectives.ts
- [x] T089 [P] [US5] Create useObjectiveMutations in src/features/objectives/hooks/use-objective-mutations.ts
- [x] T090 [US5] Create src/features/objectives/index.ts with public exports
- [x] T091 [US5] Create src/app/(auth)/objectives/page.tsx re-exporting from objectives feature
- [x] T092 [US5] Create src/app/api/objectives/route.ts re-exporting from objectives feature

**Checkpoint**: User Story 5 complete - managers can assign objectives to employees

---

## Phase 6: User Story 1 - Employee Self-Evaluation (Priority: P1)

**Goal**: Enable employees to complete self-evaluations with auto-save.

**Independent Test**: Log in as employee, view objectives, rate each one, add comments, save draft, submit.

### Tests for User Story 1

- [x] T093 [P] [US1] Unit test for scoring calculation in tests/unit/features/evaluations/
- [x] T094 [P] [US1] Unit test for auto-save hook in tests/unit/features/evaluations/
- [x] T095 [P] [US1] Integration test for PUT /api/evaluations/:id/self endpoint
- [x] T096 [P] [US1] Integration test for POST /api/evaluations/:id/self/submit endpoint
- [x] T097 [P] [US1] E2E test for self-evaluation workflow in tests/e2e/self-evaluation.spec.ts

### Implementation for User Story 1

- [x] T098 [P] [US1] Create src/features/evaluations/types.ts with Evaluation types and Zod schemas
- [x] T099 [US1] Implement evaluation handlers in src/features/evaluations/api/handlers.ts
- [x] T100 [US1] Implement evaluation validators in src/features/evaluations/api/validators.ts
- [x] T101 [US1] Implement scoring calculation in src/features/evaluations/api/scoring.ts
- [x] T102 [P] [US1] [UI/UX] Create SelfEvalForm component in src/features/evaluations/components/self-eval-form.tsx
- [x] T103 [P] [US1] [UI/UX] Create RatingSlider component in src/features/evaluations/components/rating-slider.tsx
- [x] T104 [P] [US1] [UI/UX] Create AutoSaveIndicator in src/features/evaluations/components/auto-save-indicator.tsx
- [x] T105 [P] [US1] [UI/UX] Create EvaluationStatus in src/features/evaluations/components/evaluation-status.tsx
- [x] T106 [P] [US1] Create useEvaluation hook in src/features/evaluations/hooks/use-evaluation.ts
- [x] T107 [US1] Implement useAutoSave hook with 30s debounce in src/features/evaluations/hooks/use-auto-save.ts
- [x] T108 [P] [US1] Create useScoring hook in src/features/evaluations/hooks/use-scoring.ts
- [x] T109 [US1] Create src/features/evaluations/index.ts with public exports
- [x] T110 [US1] Create src/app/(auth)/evaluations/page.tsx re-exporting from evaluations feature
- [x] T111 [US1] Create src/app/api/evaluations/route.ts re-exporting from evaluations feature

**Checkpoint**: User Story 1 complete - employees can submit self-evaluations

---

## Phase 7: User Story 2 - Manager Review & Rating (Priority: P1)

**Goal**: Enable managers to review self-evaluations and provide ratings.

**Independent Test**: Log in as manager, view team dashboard, access self-evaluation, rate objectives, submit review.

### Tests for User Story 2

- [x] T112 [P] [US2] Integration test for PUT /api/evaluations/:id/manager endpoint
- [x] T113 [P] [US2] Integration test for POST /api/evaluations/:id/manager/submit endpoint
- [x] T114 [P] [US2] E2E test for manager review workflow in tests/e2e/manager-review.spec.ts

### Implementation for User Story 2

- [x] T115 [US2] Extend evaluation handlers for manager review in src/features/evaluations/api/handlers.ts
- [x] T116 [US2] [UI/UX] Create ManagerReviewForm in src/features/evaluations/components/manager-review-form.tsx
- [x] T117 [P] [US2] [UI/UX] Create ScoreDisplay component in src/features/evaluations/components/score-display.tsx
- [x] T118 [US2] Implement return evaluation logic in src/features/evaluations/api/handlers.ts
- [x] T119 [US2] [UI/UX] Create dashboard components in src/features/dashboard/components/
- [x] T120 [P] [US2] [UI/UX] Create ManagerDashboard in src/features/dashboard/components/manager-dashboard.tsx
- [x] T121 [P] [US2] [UI/UX] Create StatusSummary in src/features/dashboard/components/status-summary.tsx
- [x] T122 [P] [US2] Create useDashboardData hook in src/features/dashboard/hooks/use-dashboard-data.ts
- [x] T123 [US2] Create src/features/dashboard/index.ts with public exports
- [x] T124 [US2] Update src/app/(auth)/page.tsx to show role-based dashboard

**Checkpoint**: User Story 2 complete - managers can complete reviews

---

## Phase 8: User Story 6 - Core Values Assessment (Priority: P2)

**Goal**: Enable managers to assess employees on company core values.

**Independent Test**: HR Admin defines core values, manager rates employee on each value during review.

### Implementation for User Story 6

- [x] T125 [P] [US6] Create src/features/core-values/types.ts with CoreValue types
- [x] T126 [US6] Implement core value CRUD handlers in src/features/core-values/api/handlers.ts
- [x] T127 [P] [US6] [UI/UX] Create CoreValueForm in src/features/core-values/components/core-value-form.tsx
- [x] T128 [P] [US6] [UI/UX] Create CoreValueRating in src/features/core-values/components/core-value-rating.tsx
- [x] T129 [P] [US6] [UI/UX] Create CoreValueList in src/features/core-values/components/core-value-list.tsx
- [x] T130 [P] [US6] Create useCoreValues hook in src/features/core-values/hooks/use-core-values.ts
- [x] T131 [US6] Create src/features/core-values/index.ts with public exports
- [x] T132 [US6] Integrate core values into manager review form

**Checkpoint**: User Story 6 complete - core values assessment functional

---

## Phase 9: User Story 7 - Notifications & Reminders (Priority: P2)

**Goal**: Send timely notifications about deadlines and submissions.

**Independent Test**: Configure notification settings, trigger events, verify notifications sent.

### Implementation for User Story 7

- [x] T133 [P] [US7] Create src/features/notifications/types.ts with Notification types
- [x] T134 [US7] Implement notification handlers in src/features/notifications/api/handlers.ts
- [x] T135 [US7] Implement in-memory queue with retry in src/features/notifications/api/queue.ts
- [x] T136 [P] [US7] Implement email service in src/features/notifications/services/email.ts
- [x] T137 [P] [US7] Implement SMS service in src/features/notifications/services/sms.ts
- [x] T138 [P] [US7] Implement Teams service in src/features/notifications/services/teams.ts
- [x] T139 [P] [US7] [UI/UX] Create NotificationBell in src/features/notifications/components/notification-bell.tsx
- [x] T140 [P] [US7] [UI/UX] Create NotificationList in src/features/notifications/components/notification-list.tsx
- [x] T141 [P] [US7] [UI/UX] Create NotificationSettings in src/features/notifications/components/notification-settings.tsx
- [x] T142 [P] [US7] Create useNotifications hook in src/features/notifications/hooks/use-notifications.ts
- [x] T143 [US7] Create src/features/notifications/index.ts with public exports
- [x] T144 [US7] Create src/app/api/notifications/route.ts

**Checkpoint**: User Story 7 complete - notifications functional

---

## Phase 10: User Story 8 - Reports & Dashboards (Priority: P2)

**Goal**: Provide visibility into evaluation progress and rating distributions.

**Independent Test**: Access dashboards, view completion rates, export reports.

### Implementation for User Story 8

- [x] T145 [P] [US8] Create src/features/reports/types.ts with Report types
- [x] T146 [US8] Implement report handlers in src/features/reports/api/handlers.ts
- [x] T147 [US8] Implement CSV export in src/features/reports/api/csv-export.ts
- [x] T148 [US8] Implement PDF generation in src/features/reports/api/pdf-generator.ts
- [x] T149 [P] [US8] [UI/UX] Create CompletionReport in src/features/reports/components/completion-report.tsx
- [x] T150 [P] [US8] [UI/UX] Create RatingDistributionChart in src/features/reports/components/rating-distribution-chart.tsx
- [x] T151 [P] [US8] [UI/UX] Create ReportFilters in src/features/reports/components/report-filters.tsx
- [x] T152 [P] [US8] [UI/UX] Create ExportDialog in src/features/reports/components/export-dialog.tsx
- [x] T153 [P] [US8] Create useReports hook in src/features/reports/hooks/use-reports.ts
- [x] T154 [US8] Create src/features/reports/index.ts with public exports
- [x] T155 [US8] Create src/app/(auth)/reports/page.tsx and src/app/api/reports/route.ts

**Checkpoint**: User Story 8 complete - reports functional

---

## Phase 11: User Story 9 - Audit Logging (Priority: P2)

**Goal**: Provide complete audit trail of all system changes.

**Independent Test**: Perform actions, view audit log with filters, export for compliance.

### Implementation for User Story 9

- [x] T156 [P] [US9] Create src/features/audit-logs/types.ts with AuditLog types
- [x] T157 [US9] Implement audit log handlers in src/features/audit-logs/api/handlers.ts
- [x] T158 [P] [US9] [UI/UX] Create AuditLogTable in src/features/audit-logs/components/audit-log-table.tsx
- [x] T159 [P] [US9] [UI/UX] Create AuditLogFilters in src/features/audit-logs/components/audit-log-filters.tsx
- [x] T160 [P] [US9] [UI/UX] Create ChangeDiff in src/features/audit-logs/components/change-diff.tsx
- [x] T161 [P] [US9] Create useAuditLogs hook in src/features/audit-logs/hooks/use-audit-logs.ts
- [x] T162 [US9] Create src/features/audit-logs/index.ts with public exports
- [x] T163 [US9] Create src/app/(auth)/audit-logs/page.tsx and src/app/api/audit-logs/route.ts
- [x] T164 [US9] Integrate audit logging into all CRUD operations using shared/lib/audit.ts

**Checkpoint**: User Story 9 complete - audit logs functional

---

## Phase 12: User Story 10 - Historical Records (Priority: P3)

**Goal**: Allow users to view historical performance evaluations.

### Implementation for User Story 10

- [X] T165 [P] [US10] Add historical queries to src/features/evaluations/api/handlers.ts
- [X] T166 [P] [US10] [UI/UX] Create HistoryList component in src/features/evaluations/components/history-list.tsx
- [X] T167 [P] [US10] [UI/UX] Create HistoryDetail component in src/features/evaluations/components/history-detail.tsx
- [X] T168 [US10] Add PDF export for historical evaluations in src/features/reports/api/pdf-generator.ts

---

## Phase 13: User Story 11 - Document Upload (Priority: P3)

**Goal**: Allow employees to upload supporting documents for objectives.

### Implementation for User Story 11

- [ ] T169 [P] [US11] Create src/features/documents/types.ts with Document types
- [ ] T170 [US11] Implement S3 presigned URL handlers in src/features/documents/api/handlers.ts
- [ ] T171 [US11] Implement S3 service in src/features/documents/api/s3-service.ts
- [ ] T172 [P] [US11] [UI/UX] Create FileUpload component in src/features/documents/components/file-upload.tsx
- [ ] T173 [P] [US11] [UI/UX] Create FileList component in src/features/documents/components/file-list.tsx
- [ ] T174 [P] [US11] Create useFileUpload hook in src/features/documents/hooks/use-file-upload.ts
- [ ] T175 [US11] Create src/features/documents/index.ts and src/app/api/documents/route.ts
- [ ] T176 [US11] Integrate document upload into self-evaluation form

---

## Phase 14: User Story 12 - Localization (Priority: P3)

**Goal**: Support Thai and English languages.

### Implementation for User Story 12

- [ ] T177 [P] [US12] Complete all UI translations in messages/en.json
- [ ] T178 [P] [US12] Complete all UI translations in messages/th.json
- [ ] T179 [US12] Create src/features/settings/types.ts with Settings types
- [ ] T180 [US12] Implement settings handlers in src/features/settings/api/handlers.ts
- [ ] T181 [P] [US12] [UI/UX] Create LanguageSelector in src/features/settings/components/language-selector.tsx
- [ ] T182 [P] [US12] Create useSettings hook in src/features/settings/hooks/use-settings.ts
- [ ] T183 [US12] Create src/features/settings/index.ts and src/app/(auth)/settings/page.tsx
- [ ] T184 [US12] Configure next-intl middleware in src/middleware.ts

---

## Phase 15: Polish & Cross-Cutting Concerns

**Goal**: Final polish, performance optimization, and documentation.

- [ ] T185 [P] [UI/UX] Create EmployeeDashboard in src/features/dashboard/components/employee-dashboard.tsx
- [ ] T186 [P] [UI/UX] Create HRDashboard in src/features/dashboard/components/hr-dashboard.tsx
- [ ] T187 [P] [UI/UX] Create CompletionChart in src/features/dashboard/components/completion-chart.tsx
- [ ] T188 [UI/UX] Update src/app/(auth)/layout.tsx with navigation sidebar
- [ ] T189 [P] [UI/UX] Add loading states to all page components
- [ ] T190 [P] [UI/UX] Add error boundaries to all page components
- [ ] T191 Implement deadline job scheduler in src/features/cycles/api/deadline-jobs.ts
- [ ] T192 Implement escalation logic for overdue reviews
- [ ] T193 [P] Add rate limiting to API routes
- [ ] T194 [P] Add CSP headers and security hardening
- [ ] T195 Run full E2E test suite and fix failures
- [ ] T196 Verify 80% code coverage threshold
- [ ] T197 Performance test with 500 concurrent users
- [ ] T198 Update README.md with project documentation

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ──► Required by all user stories
    ↓
┌───┴───────────────────────────────────────────────┐
│                    P1 Stories                      │
├───────────────────────────────────────────────────┤
│ Phase 3 (US4: Users)     ← No dependencies        │
│ Phase 4 (US3: Cycles)    ← No dependencies        │
│ Phase 5 (US5: Objectives) ← Depends on US4, US3   │
│ Phase 6 (US1: Self-Eval)  ← Depends on US5        │
│ Phase 7 (US2: Manager)    ← Depends on US1        │
└───────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────┐
│                    P2 Stories                      │
├───────────────────────────────────────────────────┤
│ Phase 8  (US6: Core Values) ← Depends on US2      │
│ Phase 9  (US7: Notifications) ← Independent       │
│ Phase 10 (US8: Reports)     ← Depends on US1, US2 │
│ Phase 11 (US9: Audit Logs)  ← Independent         │
└───────────────────────────────────────────────────┘
                    ↓
┌───────────────────────────────────────────────────┐
│                    P3 Stories                      │
├───────────────────────────────────────────────────┤
│ Phase 12 (US10: History)    ← Depends on US1, US2 │
│ Phase 13 (US11: Documents)  ← Depends on US5      │
│ Phase 14 (US12: Localization) ← Independent       │
└───────────────────────────────────────────────────┘
                    ↓
              Phase 15 (Polish)
```

### User Story Completion Order

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US4 (Users) | None | Phase 2 complete |
| US3 (Cycles) | None | Phase 2 complete |
| US5 (Objectives) | US4, US3 | US4 + US3 complete |
| US1 (Self-Eval) | US5 | US5 complete |
| US2 (Manager) | US1 | US1 complete |
| US6 (Core Values) | US2 | US2 complete |
| US7 (Notifications) | None | Phase 2 complete |
| US8 (Reports) | US1, US2 | US2 complete |
| US9 (Audit Logs) | None | Phase 2 complete |
| US10 (History) | US1, US2 | US2 complete |
| US11 (Documents) | US5 | US5 complete |
| US12 (Localization) | None | Phase 2 complete |

---

## Parallel Execution Examples

### Within Phase 3 (US4) - Maximum Parallelization
```bash
# Developer A: API layer
T037, T038, T039, T040, T041, T042, T043, T044, T045

# Developer B: UI components
T046, T047, T048, T049, T050, T051

# Developer C: Org chart (separate feature)
T057, T058, T059
```

### Within Phase 6 (US1) - Maximum Parallelization
```bash
# Developer A: Tests and API
T093, T094, T095, T096, T097, T098, T099, T100, T101

# Developer B: UI components
T102, T103, T104, T105, T106, T107, T108
```

---

## Implementation Strategy

### MVP Scope (P1 Only)

**Recommended first delivery**: Complete Phases 1-7 to deliver core evaluation workflow.

| Phase | Story | Business Value |
|-------|-------|----------------|
| 1-2 | Setup | Infrastructure |
| 3 | US4 | User management enables permissions |
| 4 | US3 | Cycle config enables reviews |
| 5 | US5 | Objectives enable evaluation |
| 6 | US1 | Self-evaluation replaces Excel |
| 7 | US2 | Manager review completes workflow |

**MVP Deliverable**: Full evaluation cycle from objective assignment through manager review.

### Incremental Delivery

| Increment | Stories Included | Estimated Effort |
|-----------|------------------|------------------|
| **MVP** | US1-US5 (P1) | 60% of effort |
| **Enhancement 1** | US6-US9 (P2) | 25% of effort |
| **Enhancement 2** | US10-US12 (P3) | 15% of effort |

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] [UI/UX?] Description with file path`
✅ Task IDs are sequential (T001-T198)
✅ [P] markers indicate parallelizable tasks
✅ [US#] labels map to user stories from spec.md
✅ [UI/UX] markers indicate tasks requiring `ui-ux-pro-max` skill with **Professional Corporate** style
✅ File paths use feature-based structure from plan.md

---

## Notes

- Tests are included per Constitution Principle I (TDD Non-Negotiable)
- Feature-based structure follows Constitution Principle VI (Vertical Slice Architecture)
- All file paths follow the structure defined in plan.md
- Shared utilities placed in `src/shared/` per architecture guidelines
