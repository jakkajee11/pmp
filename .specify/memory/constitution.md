<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.1.0
- Added sections: Principle VI. Vertical Slice Architecture
- Modified principles: None (new principle added)
- Removed sections: None
- Templates requiring updates:
  ✅ plan-template.md - verified compatible (supports feature-based structure)
  ✅ spec-template.md - verified compatible
  ✅ tasks-template.md - verified compatible (supports feature-based organization)
- Follow-up TODOs: None
- Rationale for MINOR bump: New principle added without removing or redefining existing principles
-->

# Performance Metrics Portal Constitution

## Core Principles

### I. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory for all production code. The Red-Green-Refactor cycle MUST be followed:

1. **Write failing tests first** — Tests MUST be written before implementation
2. **User approval required** — Tests MUST be reviewed and approved before implementation begins
3. **Verify tests fail** — Confirm tests fail for the right reasons before writing code
4. **Implement to pass** — Write the minimum code necessary to make tests pass
5. **Refactor** — Clean up code while keeping tests green

**Coverage Requirements:**
- Unit tests: Minimum 80% code coverage
- Integration tests: Required for API endpoints, database operations, and external integrations
- E2E tests: Required for critical user journeys (self-evaluation, manager review, cycle configuration)

**Rationale:** The PMP handles compensation calculations and employee performance data. Errors directly impact people's livelihoods and trust. TDD prevents calculation bugs and ensures business logic correctness.

### II. Security & Privacy First

All code MUST comply with both PDPA (Thailand Personal Data Protection Act B.E. 2562) and OWASP Top 10 security standards.

**PDPA Compliance (Mandatory):**
- Collect only necessary data (data minimization)
- Encrypt sensitive PII at rest (AES-256) and in transit (TLS 1.3+)
- Log all data access and modifications (5-year retention)
- Provide data export and correction capabilities for employees
- Notify affected parties within 72 hours of breach detection

**OWASP Top 10 Controls (Mandatory):**
- SQL injection prevention: Parameterized queries only (no raw SQL)
- XSS prevention: Input sanitization, output encoding, CSP headers
- CSRF prevention: Same-origin cookies + CSRF tokens
- Broken access control: RBAC enforced at API middleware and UI level
- Security misconfiguration: No default credentials, secure headers enabled

**Code Review Requirement:** All PRs touching authentication, authorization, or PII handling MUST be reviewed by a second developer with security focus.

**Rationale:** Employee performance data is highly sensitive. A breach or misuse could result in legal liability, regulatory fines, and loss of employee trust.

### III. Code Quality Standards

All code MUST meet the following quality gates:

**TypeScript Standards:**
- Strict mode enabled (`strict: true`)
- No `any` types without explicit justification in comments
- All functions must have explicit return types for public APIs

**Linting & Formatting:**
- ESLint with recommended rules MUST pass
- Prettier formatting MUST be applied
- No linting warnings in production builds

**Code Review:**
- All code requires at least one approval before merge
- PRs must be under 400 lines of code (split larger changes)
- Self-review checklist MUST be completed

**Documentation:**
- Public APIs MUST have JSDoc comments
- Complex business logic (scoring, weighting) MUST have inline comments explaining the "why"
- README updates required for new features

**Rationale:** A 7-month project with 4 developers requires consistent code quality to maintain velocity and reduce technical debt. Poor code quality will slow down later phases.

### IV. Observability & Auditability

All features MUST include comprehensive logging and audit trails.

**Application Logging:**
- Structured JSON logging using Pino
- Log levels: error (always), warn (production), info (key events), debug (development only)
- All API requests logged with: timestamp, user ID, action, response time, status code
- No PII in log messages (use IDs, not names/emails)

**Audit Logging (Compliance-Critical):**
- All CRUD operations on evaluations, objectives, and user data MUST be logged
- Audit entries MUST include: timestamp, user ID, action, entity type, entity ID, old values, new values, IP address
- Audit logs retained for 5 years (PDPA requirement)
- Audit logs stored in separate table with restricted access

**Error Handling:**
- All errors MUST be caught and logged with context
- User-facing errors MUST have localized messages (Thai/English)
- No stack traces exposed to users in production

**Rationale:** The PMP handles performance reviews that affect compensation. Complete audit trails are essential for dispute resolution, compliance audits, and debugging production issues.

### V. Simplicity & YAGNI

Start simple. Do not build for hypothetical future requirements.

**Guidelines:**
- Implement only what the spec requires
- No premature abstractions (wait for 3 similar patterns before abstracting)
- Prefer standard library and well-maintained packages over custom solutions
- Avoid over-engineering: If a feature can be done in 50 lines, don't write 200

**Technology Constraints:**
- Stick to the approved tech stack: Next.js, TypeScript, PostgreSQL, S3
- New dependencies require justification in PR description
- No experimental or alpha-stage packages

**Rationale:** The project has a tight 7-month timeline with a fixed October 2026 launch date. Over-engineering risks missed deadlines and budget overruns.

### VI. Vertical Slice Architecture

Code MUST be organized by feature, not by technical layer. Each feature is a self-contained vertical slice.

**Structure Requirements:**
- Each feature module contains its own: API handlers, components, hooks, types, and tests
- Features live in `src/features/[feature-name]/`
- Shared utilities (no business logic) live in `src/shared/`
- The `app/` directory is a thin routing layer that re-exports from features

**Feature Module Pattern:**
```
features/[feature-name]/
├── api/              # Server-side logic (handlers, validators, services)
├── components/       # React components specific to this feature
├── hooks/            # Custom React hooks for this feature
├── types.ts          # TypeScript types and Zod schemas
└── index.ts          # Public API - only export what other features need
```

**Cross-Feature Communication:**
- Features MUST NOT import directly from other features
- Use `shared/` for common utilities and types
- Cross-feature data needs go through API calls or shared state

**Benefits:**
- Changes to one feature don't affect others
- Teams can own entire feature modules end-to-end
- Reduced merge conflicts in parallel development
- Clear ownership boundaries

**Rationale:** Feature-based organization scales better than layer-based for teams working in parallel. It aligns code boundaries with business domains, making the codebase easier to navigate, maintain, and test.

## Technical Standards

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (React) | 14.x with App Router |
| Backend | Next.js API Routes | 14.x |
| Language | TypeScript | 5.x (strict mode) |
| Database | PostgreSQL | 15.x |
| File Storage | Amazon S3 | N/A |
| Authentication | OIDC + JWT | N/A |
| Hosting | OpenShift Container Platform | N/A |

### Project Structure

```text
src/
├── app/                    # Next.js App Router (thin routing layer)
├── features/               # Feature modules (business logic)
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
│   └── settings/
├── shared/                 # Shared utilities (no business logic)
├── messages/               # i18n translations
└── middleware.ts           # Auth & i18n middleware
```

### API Design Standards

- RESTful endpoints following resource-oriented design
- Consistent response format: `{ success, data, error, message }`
- HTTP status codes used correctly (200, 201, 400, 401, 403, 404, 500)
- All endpoints documented with OpenAPI/Swagger

### Database Standards

- All tables MUST have `id`, `created_at`, `updated_at` columns
- Foreign keys MUST have proper constraints and indexes
- Migrations MUST be reversible
- No direct database access outside of feature API layer

## Development Workflow

### Branch Strategy

- `main` — Production-ready code only
- `feature/*` — Feature branches from main
- `bugfix/*` — Bug fix branches from main

### Pull Request Process

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature within appropriate feature module
4. Ensure all CI checks pass (lint, test, build)
5. Request code review
6. Address review feedback
7. Squash and merge to `main`

### CI/CD Gates

| Stage | Checks |
|-------|--------|
| Lint | ESLint, Prettier, TypeScript type check |
| Test | Unit tests (80%+ coverage), Integration tests |
| Build | Next.js production build, Docker image |
| Deploy | Staging → Manual approval → Production |

### Quality Gates (Must Pass Before Merge)

- [ ] All tests pass (unit + integration)
- [ ] Code coverage ≥ 80%
- [ ] No TypeScript errors
- [ ] No ESLint errors or warnings
- [ ] At least one code review approval
- [ ] Documentation updated (if applicable)
- [ ] Code placed in correct feature module

## Governance

### Amendment Process

1. Proposed changes MUST be documented with rationale
2. Changes MUST be reviewed by at least 2 team members
3. Breaking changes require migration plan
4. Constitution version MUST be incremented according to semantic versioning:
   - **MAJOR**: Backward incompatible principle removals or redefinitions
   - **MINOR**: New principles added or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements

### Compliance

- All PRs MUST verify compliance with this constitution
- Complexity beyond spec requirements MUST be justified in writing
- Security-related PRs require additional review by designated security reviewer
- Cross-feature imports MUST be flagged in code review

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.1.0 | 2026-03-19 | Added Principle VI: Vertical Slice Architecture; Added project structure to Technical Standards |
| 1.0.0 | 2026-03-18 | Initial constitution ratified |

**Version**: 1.1.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-19
