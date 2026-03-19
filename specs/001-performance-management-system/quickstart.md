# Quickstart Guide: Performance Metrics Portal

**Prerequisites**: Node.js 20+, PostgreSQL 15+, Docker (optional)

## Quick Setup

### 1. Clone and Install

```bash
git clone <repo-url>
cd pmp
npm install
```

### 2. Environment Configuration

Create `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pmp?schema=public"

# OIDC (configure with your provider)
OIDC_ISSUER="https://your-idp.com"
OIDC_CLIENT_ID="your-client-id"
OIDC_CLIENT_SECRET="your-client-secret"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3 (file uploads)
AWS_REGION="ap-southeast-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="pmp-uploads"

# Notifications (optional for development)
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# (Optional) Seed with test data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

Open http://localhost:13300

---

## Feature-Based Project Structure

```
src/
├── app/                    # Next.js App Router (thin routing layer)
│   ├── (auth)/             # Protected routes
│   │   ├── dashboard/
│   │   ├── evaluations/
│   │   ├── objectives/
│   │   ├── cycles/
│   │   ├── users/
│   │   ├── reports/
│   │   └── settings/
│   └── api/                # API routes
│
├── features/               # Feature modules (business logic)
│   ├── auth/               # Authentication
│   ├── users/              # User management
│   ├── cycles/             # Review cycle management
│   ├── objectives/         # Objective assignment
│   ├── evaluations/        # Self-eval & Manager review
│   ├── core-values/        # Core values assessment
│   ├── dashboard/          # Role-based dashboards
│   ├── reports/            # Reports & exports
│   ├── notifications/      # Notification system
│   ├── documents/          # File uploads
│   ├── audit-logs/         # Audit trail
│   ├── org-chart/          # Organization visualization
│   └── settings/           # User preferences
│
├── shared/                 # Shared utilities
│   ├── api/                # Response helpers, middleware
│   ├── components/         # UI components (shadcn/ui)
│   ├── hooks/              # Shared hooks
│   ├── lib/                # DB, logger, audit
│   ├── types/              # Common types
│   └── utils/              # Utility functions
│
├── messages/               # i18n translations
└── middleware.ts           # Auth & i18n middleware
```

---

## Feature Module Pattern

Each feature is self-contained:

```text
features/[feature-name]/
├── api/
│   ├── handlers.ts         # API route handlers
│   ├── validators.ts       # Request validation (Zod)
│   └── [service].ts        # Business logic services
├── components/
│   ├── [feature]-form.tsx  # Main form component
│   ├── [feature]-list.tsx  # List/table component
│   └── [feature]-card.tsx  # Card/item component
├── hooks/
│   └── use-[feature].ts    # Custom hooks
├── types.ts                # Types & Zod schemas
└── index.ts                # Public API exports
```

### Example: Evaluations Feature

```text
features/evaluations/
├── api/
│   ├── handlers.ts         # GET, POST, PUT handlers
│   ├── validators.ts       # Zod validation schemas
│   └── scoring.ts          # Weighted score calculation
├── components/
│   ├── self-eval-form.tsx  # Employee self-evaluation form
│   ├── manager-review-form.tsx
│   ├── rating-slider.tsx   # Reusable rating component
│   └── score-display.tsx   # Final score display
├── hooks/
│   ├── use-evaluation.ts   # Fetch/manage evaluation
│   ├── use-auto-save.ts    # 30s auto-save
│   └── use-scoring.ts      # Calculate scores
├── types.ts
└── index.ts
```

---

## Key Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npx prisma studio        # Open Prisma Studio
npx prisma migrate dev   # Create & run migration
npx prisma migrate reset # Reset database

# Testing
npm run test             # Run unit tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run test:e2e         # E2E tests

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier
npm run typecheck        # TypeScript check
```

---

## Development Workflow

### Adding a New Feature

1. **Create feature directory**:
   ```bash
   mkdir -p src/features/new-feature/{api,components,hooks}
   touch src/features/new-feature/types.ts
   touch src/features/new-feature/index.ts
   ```

2. **Define types** in `types.ts`:
   ```typescript
   import { z } from 'zod';

   export const NewFeatureSchema = z.object({
     name: z.string(),
     // ...
   });

   export type NewFeature = z.infer<typeof NewFeatureSchema>;
   ```

3. **Create API handlers** in `api/handlers.ts`:
   ```typescript
   import { apiResponse, apiError } from '@/shared/api/response';

   export async function getNewFeature(request: Request) {
     // Implementation
   }
   ```

4. **Create route in app/**:
   ```typescript
   // src/app/(auth)/new-feature/route.ts
   export { GET, POST } from '@/features/new-feature/api/handlers';
   ```

5. **Write tests** alongside code:
   ```typescript
   // src/features/new-feature/api/__tests__/handlers.test.ts
   ```

### Modifying an Existing Feature

All changes stay within the feature directory:
- API changes → `features/[name]/api/`
- UI changes → `features/[name]/components/`
- New hooks → `features/[name]/hooks/`

---

## Common Patterns

### API Handler Pattern

```typescript
// features/evaluations/api/handlers.ts
import { apiResponse, apiError } from '@/shared/api/response';
import { withAuth, withRBAC } from '@/shared/api/middleware';
import { evaluationSchema } from '../types';

export const GET = withAuth(async (request, { params }) => {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: params.id },
  });

  if (!evaluation) {
    return apiError('NOT_FOUND', 'Evaluation not found', 404);
  }

  return apiResponse(evaluation);
});

export const PUT = withRBAC(['employee'], async (request, { params }) => {
  const body = await request.json();
  const data = evaluationSchema.parse(body);

  const updated = await prisma.evaluation.update({
    where: { id: params.id },
    data,
  });

  return apiResponse(updated);
});
```

### Component Pattern

```typescript
// features/evaluations/components/rating-slider.tsx
'use client';

import { useAutoSave } from '../hooks/use-auto-save';

interface RatingSliderProps {
  value: number;
  onChange: (value: number) => void;
  objectiveId: string;
}

export function RatingSlider({ value, onChange, objectiveId }: RatingSliderProps) {
  const { save, status } = useAutoSave(objectiveId);

  const handleChange = async (newValue: number) => {
    onChange(newValue);
    await save({ rating: newValue });
  };

  return (
    <div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => handleChange(Number(e.target.value))}
      />
      <AutoSaveIndicator status={status} />
    </div>
  );
}
```

### Audit Logging

```typescript
import { auditLog } from '@/shared/lib/audit';

await auditLog({
  userId: session.user.id,
  action: 'update',
  entityType: 'Evaluation',
  entityId: evaluation.id,
  oldValues: { status: 'draft' },
  newValues: { status: 'submitted' },
  ipAddress: request.headers.get('x-forwarded-for'),
});
```

### Notification Queue

```typescript
import { notificationQueue } from '@/features/notifications/api/queue';

await notificationQueue.add({
  userId: managerId,
  type: 'submission_confirm',
  channels: ['email', 'teams'],
  data: { employeeName, cycleName },
});
```

---

## Testing Guidelines

### Unit Test (co-located)

```typescript
// features/evaluations/api/__tests__/scoring.test.ts
import { calculateFinalScore } from '../scoring';

describe('calculateFinalScore', () => {
  it('calculates weighted score correctly', () => {
    const result = calculateFinalScore({
      kpiScore: 4.0,
      coreValuesScore: 3.0,
      weights: { kpi: 0.8, core_values: 0.2 },
    });
    expect(result).toBe(3.80);
  });
});
```

### Integration Test

```typescript
// tests/integration/features/evaluations/evaluations-api.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, PUT } from '@/features/evaluations/api/handlers';

describe('/api/evaluations/:id', () => {
  it('returns evaluation by id', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await GET(req, { params: { id: 'test-id' } });
    expect(res._getStatusCode()).toBe(200);
  });
});
```

### E2E Test

```typescript
// tests/e2e/self-evaluation.spec.ts
import { test, expect } from '@playwright/test';

test('employee can submit self-evaluation', async ({ page }) => {
  await page.goto('/login');
  // ... login steps

  await page.goto('/evaluations');
  await page.click('[data-testid="objective-1"]');

  await page.selectOption('[name="self_rating"]', '4');
  await page.fill('[name="self_comments"]', 'Achieved all goals');

  await page.click('[data-testid="save-draft"]');
  await expect(page.locator('.toast')).toContainText('Saved');
});
```

---

## Import Guidelines

### ✅ Good: Import from shared or feature index

```typescript
import { Button } from '@/shared/components/ui/button';
import { apiResponse } from '@/shared/api/response';
import { useEvaluation } from '@/features/evaluations';
```

### ❌ Bad: Direct cross-feature imports

```typescript
// Don't do this:
import { useUsers } from '@/features/users/hooks/use-users';
```

### ✅ Instead: Use feature's public API

```typescript
// Do this:
import { useUsers } from '@/features/users';
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset connection
npx prisma migrate reset
```

### OIDC Login Issues

1. Verify OIDC credentials in `.env.local`
2. Check callback URL matches provider config
3. Review NextAuth.js logs: `DEBUG=next-auth:* npm run dev`

### Test Failures

```bash
# Clear Jest cache
npm run test -- --clearCache

# Run specific test file
npm run test -- features/evaluations
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## Useful Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Feature-Sliced Design](https://feature-sliced.design/) - Architecture inspiration
- [Project Constitution](/.specify/memory/constitution.md)
- [API Contracts](./contracts/api.md)
