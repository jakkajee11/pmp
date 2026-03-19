# Research: Performance Metrics Portal

**Date**: 2026-03-18
**Status**: Phase 0 Research

## Research Questions

### 1. OIDC Authentication with Next.js

**Decision**: NextAuth.js (Auth.js) v5 with OIDC provider

**Rationale**:
- Native Next.js integration with App Router support
- Built-in OIDC provider support
- Session management with JWT tokens
- CSRF protection included
- TypeScript support

**Alternatives Considered**:
- **Passport.js**: More Express-oriented, requires additional setup for Next.js
- **Custom implementation**: Higher risk, reinventing security-critical code

**Implementation Notes**:
- Configure OIDC provider in `auth.ts` at root
- Use `getServerSession` in API routes for auth checking
- Store user profile in PostgreSQL after first login (JIT provisioning)

---

### 2. Database ORM Selection

**Decision**: Prisma ORM

**Rationale**:
- Type-safe database access with auto-generated TypeScript types
- Declarative schema with migration support
- Excellent Next.js integration
- Built-in connection pooling
- Supports all required PostgreSQL features (JSONB, arrays, etc.)

**Alternatives Considered**:
- **Drizzle ORM**: Lighter weight but less mature tooling
- **pg (node-postgres)**: More control but requires manual type definitions
- **TypeORM**: Heavier, decorator-based approach doesn't fit functional React patterns

**Implementation Notes**:
- Schema in `prisma/schema.prisma`
- Use Prisma Client in API routes
- Enable query logging in development only

---

### 3. File Storage with S3

**Decision**: AWS SDK v3 with presigned URLs

**Rationale**:
- Direct browser-to-S3 uploads via presigned URLs (reduces server load)
- AWS SDK v3 is modular and tree-shakeable
- Secure access control through URL expiration
- Constitution-compliant: AES-256 encryption at rest

**Alternatives Considered**:
- **Server-side upload**: Simpler but doesn't scale for 10MB files
- **Base64 in database**: Anti-pattern, bloats database

**Implementation Notes**:
- Generate presigned PUT URL on frontend request
- 10MB limit enforced on both client and presigned URL conditions
- File types restricted via S3 bucket policy
- Store only file metadata in PostgreSQL (key, size, type)

---

### 4. Notification Queue with Retry Logic

**Decision**: In-memory queue with BullMQ pattern (no Redis required)

**Rationale**:
- Constitution specifies file-based observability (no external infrastructure)
- Expected volume: ~5000 notifications per cycle (manageable without Redis)
- Retry with exponential backoff: 1min, 5min, 15min
- Failed notifications logged to file, not retried after 3 attempts

**Alternatives Considered**:
- **Redis + Bull**: Over-engineering for notification volume
- **No queue**: Risk of lost notifications during transient failures
- **Database queue**: Adds DB load, unnecessary complexity

**Implementation Notes**:
- Create `NotificationQueue` class with in-memory job storage
- Process jobs in background (Next.js API route or separate process)
- Log all retry attempts and final failures
- Continue user workflow regardless of notification status

---

### 5. Internationalization (Thai/English)

**Decision**: next-intl package

**Rationale**:
- Official Next.js i18n recommendation
- App Router support with middleware
- ICU message format for complex translations
- Date/number formatting included
- Server and client component support

**Alternatives Considered**:
- **next-i18next**: Pages Router focused, less App Router support
- **Custom solution**: Duplicate effort, error-prone

**Implementation Notes**:
- Store user language preference in database
- Detect from accept-language header on first visit
- Date format: DD/MM/YYYY (Thai), MM/DD/YYYY (English)
- All UI strings in `/messages/en.json` and `/messages/th.json`

---

### 6. Concurrent Edit Handling (Optimistic Locking)

**Decision**: Version field with optimistic locking

**Rationale**:
- Simple implementation: add `version` integer to modifiable entities
- Check version on update: `WHERE id = ? AND version = ?`
- Increment version on successful update
- Return conflict error if version mismatch

**Alternatives Considered**:
- **Pessimistic locking**: Requires DB locks, poor UX for long forms
- **Last write wins**: Loses data, unacceptable for evaluation data

**Implementation Notes**:
- Apply to Evaluation, Objective entities
- Frontend shows "refresh to see changes" message on conflict
- Auto-save includes version check

---

### 7. PDF Report Generation

**Decision**: @react-pdf/renderer

**Rationale**:
- React-based PDF templates (familiar paradigm)
- Server-side rendering support
- No external dependencies (pure JavaScript)
- Good for structured reports with tables

**Alternatives Considered**:
- **Puppeteer**: Heavy, requires headless browser
- **PDFKit**: Lower-level, more manual work
- **External API**: Data leaves system (PDPA concern)

**Implementation Notes**:
- Create PDF templates in `/lib/pdf-templates/`
- Generate on API route, return as download
- Include company branding (logo, colors)

---

### 8. CSV Import/Export

**Decision**: PapaParse library

**Rationale**:
- Battle-tested, well-maintained
- Streaming support for large files
- Both parse (import) and unparse (export) functions
- Handles edge cases (quotes, commas in values)

**Alternatives Considered**:
- **Native CSV parsing**: Edge cases are tricky
- **xlsx library**: Overkill for CSV-only requirements

**Implementation Notes**:
- Import: Validate row-by-row, collect errors, partial import allowed
- Export: Stream response for large datasets
- UTF-8 with BOM for Thai character support

---

### 9. Auto-Save Implementation

**Decision**: Debounced API calls with local storage backup

**Rationale**:
- 30-second auto-save requirement in spec
- Debounce prevents excessive API calls
- localStorage provides offline resilience
- Version check prevents conflicts

**Implementation Notes**:
- Use lodash.debounce with 30s delay
- Save to localStorage immediately, sync to API after debounce
- Restore from localStorage on page reload if draft exists
- Clear localStorage after successful submission

---

### 10. Org Chart Visualization

**Decision**: React Flow library

**Rationale**:
- React-native, handles hierarchical layouts
- Interactive (zoom, pan, collapse)
- Customizable node rendering
- Good performance for 500-2000 nodes

**Alternatives Considered**:
- **D3.js**: More flexible but steeper learning curve
- **Static SVG**: Not interactive, harder to maintain

**Implementation Notes**:
- Lazy load org chart data by department
- Start collapsed, expand on click
- Highlight user's position in hierarchy

---

---

### 11. Next.js 16.2.0 Upgrade (Framework Upgrade)

**Date**: 2026-03-20

**Decision**: Upgrade from Next.js 14.2.28 to Next.js 16.2.0

**Rationale**:
- Access to latest performance improvements and features
- React 19 support with improved concurrent features
- Better Turbopack stability (now default in dev)
- Improved caching and partial prerendering
- Security patches and bug fixes
- Long-term support alignment

**Breaking Changes to Address**:

1. **Async Request APIs (Next.js 15+)**
   - `cookies()`, `headers()`, `draftMode()` must be awaited
   - Route `params` and `searchParams` must be awaited in Server Components
   - Example: `const { id } = await params` instead of `const { id } = params`

2. **React 19 Compatibility**
   - Current: React 18.3.1 → Target: React 19.x
   - `useFormStatus` and `useFormState` moved to `react-dom`
   - New `use()` hook for promise unwrapping
   - Ref as prop pattern changes

3. **Turbopack Default**
   - Development server uses Turbopack by default
   - May need webpack fallback for some edge cases

4. **Removed APIs**
   - `router.events` removed (use native events)
   - Some deprecated `next/image` props removed

**Files Requiring Changes**:
- `src/app/**/page.tsx` - Server Components with params/searchParams
- `src/app/api/**/route.ts` - API routes using cookies/headers
- `src/middleware.ts` - May need updates for new patterns
- `src/features/**/api/*.ts` - Server actions and handlers
- `package.json` - Version updates

**Migration Strategy**:
1. Update package.json versions
2. Run codemods for async APIs: `npx @next/codemods@latest next-15-async-request-apis .`
3. Fix remaining TypeScript errors manually
4. Update tests for async patterns
5. Run full test suite
6. Manual QA of critical flows

**Alternatives Considered**:
- **Stay on Next.js 14.x**: Missing security updates and features, technical debt accumulates
- **Upgrade to Next.js 15.x first**: Intermediate step not necessary; direct upgrade to 16.x is supported
- **Gradual migration**: Not feasible; framework upgrade is atomic

**Risk Assessment**:
- **Risk Level**: Medium-High (2 major version jump)
- **Estimated Effort**: 4-8 hours for migration + testing
- **Rollback Plan**: Git revert if critical issues found

---

## Summary of Technology Decisions

| Concern | Technology | Version |
|---------|------------|---------|
| Framework | Next.js | 16.2.0 (upgrade from 14.x) |
| Language | TypeScript | 5.x |
| Database ORM | Prisma | 5.x |
| Authentication | NextAuth.js (Auth.js) | 5.x |
| File Storage | AWS SDK v3 | 3.x |
| i18n | next-intl | 3.x |
| PDF Generation | @react-pdf/renderer | 3.x |
| CSV Processing | PapaParse | 5.x |
| Org Chart | React Flow | 11.x |
| UI Components | shadcn/ui | latest |
| Charts | Recharts | 2.x |

All decisions align with Constitution Principle V (Simplicity & YAGNI) - using established, well-maintained packages without over-engineering.
