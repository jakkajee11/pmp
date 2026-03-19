# Auto-QA Workflow

**Trigger:** `/workflow.autoQA`

**Purpose:** Automatically test tasks in the QA queue by running affected tests only.

## Automation Configuration

Loaded from `.specify/memory/workflow-state.json`:
```json
{
  "automation": {
    "enabled": true,
    "qaScope": "affected",
    "qaChecks": ["affected-tests"]
  }
}
```

## Workflow

1. **Load State**
   - Read `.specify/memory/workflow-state.json`
   - Check `in_qa` queue for tasks
   - Load automation configuration

2. **Display Status**
   ```
   === AUTO-QA WORKFLOW ===
   Scope: Affected Tests Only
   Tasks in Queue: X

   Processing QA queue...
   ```

3. **Testing Process (Per Task)**

   a. **Identify Affected Files**
      ```bash
      git diff --name-only HEAD~1 HEAD
      ```

   b. **Map Source to Test Files**
      For each changed file, find corresponding tests:
      ```
      src/components/Form.tsx → src/components/Form.test.tsx
      src/lib/utils.ts → src/lib/utils.test.ts
      src/api/handlers.ts → tests/api/handlers.test.ts
      ```

   c. **Verify Test Existence (MANDATORY)**
      For each changed source file, verify at least one test file exists:
      - Check patterns: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
      - Check locations: same directory, `tests/` mirror, `__tests__/`
      - If NO tests found for ANY non-exempt changed source file → FAIL immediately
      - Record which files are missing tests for the failure report

      **Exempt file types (no tests required):**
      - Type definition files: `*.d.ts`, `types.ts`, `*-types.ts`
      - Configuration files: `*.config.ts`, `*.config.js`
      - Database migrations: `migrations/**`
      - Index/barrel files: `index.ts` (only exports, no logic)
      - CSS/styling: `*.css`, `*.scss`, `*.module.css`
      - Static assets: `*.json`, `*.md`, `*.txt`

      **Decision:** If ALL changed files are exempt → proceed with PASS
                 If ANY non-exempt file lacks tests → FAIL

   d. **Run Affected Tests**
      ```bash
      # Jest with findRelatedTests
      npm test -- --findRelatedTests <changed-files>

      # Or run specific test patterns
      npm test -- --testPathPattern="<test-pattern>"
      ```

   d. **Check for Runtime Errors**
      - TypeScript compilation: `npx tsc --noEmit`
      - Build check: `npm run build` (if quick)

4. **Decision Logic**

   **PASS Conditions:**
   - All affected tests pass
   - No TypeScript compilation errors
   - No runtime errors detected
   - Test files exist for all non-exempt changed source files

   **FAIL Conditions:**
   - No test files found for changed source files
   - Any test failure
   - TypeScript errors
   - Build failures

5. **Result Actions**

   **PASS:**
   ```json
   {
     "stage": "completed",
     "qaPassedAt": "ISO timestamp",
     "qaScope": "affected",
     "qaNotes": "Auto-passed: all affected tests pass",
     "testsRun": ["Form.test.tsx", "utils.test.ts"],
     "testsPassed": 15,
     "testsFailed": 0
   }
   ```
   - Move task to `completed` queue
   - Remove from `in_qa` queue
   - Update tasks.md: Mark task `[X]` completed
   - Log: "Task T093 completed successfully"

   **FAIL:**
   ```json
   {
     "stage": "in_development",
     "qaFailedAt": "ISO timestamp",
     "qaScope": "affected",
     "qaNotes": "Tests failed",
     "testsRun": ["Form.test.tsx"],
     "testsPassed": 10,
     "testsFailed": 2,
     "failures": [
       {
         "file": "Form.test.tsx",
         "test": "should validate input",
         "error": "Expected true, got false"
       }
     ]
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_qa` queue
   - Log: "Task T093 failed QA, returned to development"

   **FAIL (No Tests):**
   ```json
   {
     "stage": "in_development",
     "qaFailedAt": "ISO timestamp",
     "qaScope": "affected",
     "qaNotes": "FAILED: No test files found for changed source files. Tests are REQUIRED before QA approval.",
     "testsRun": [],
     "testsPassed": 0,
     "testsFailed": 0,
     "missingTests": [
       {
         "sourceFile": "src/components/NewFeature.tsx",
         "expectedTestPatterns": [
           "src/components/NewFeature.test.tsx",
           "tests/components/NewFeature.test.tsx"
         ]
       }
     ]
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_qa` queue
   - Log: "Task T093 failed QA: No tests found. Returned to development"

6. **Completion Report**
   After all QA tasks processed:
   ```
   === QA COMPLETION SUMMARY ===
   Total Processed: 7
   Passed: 7
   Failed: 0

   Completed Tasks:
   - T125: Create core-values/types.ts
   - T126: Implement core value CRUD handlers
   - T127: Create CoreValueForm component
   - T128: Create CoreValueRating component
   - T129: Create CoreValueList component
   - T130: Create useCoreValues hook
   - T131: Create core-values/index.ts
   ```

## Output Format

```
=== AUTO-QA RESULTS ===
Scope: Affected Tests Only
Tasks Processed: 7

PASSED (7 tasks):
  T125 - 3 tests passed
  T126 - 8 tests passed
  T127 - 12 tests passed
  T128 - 5 tests passed
  T129 - 4 tests passed
  T130 - 6 tests passed
  T131 - 2 tests passed

FAILED (0 tasks):
  None

Moving 7 tasks to completed queue...
Updating tasks.md...
```

## Test Mapping Rules

| Source Pattern | Test Pattern |
|----------------|--------------|
| `src/**/*.ts` | `src/**/*.test.ts` or `tests/**/*.test.ts` |
| `src/**/*.tsx` | `src/**/*.test.tsx` or `tests/**/*.test.tsx` |
| `src/app/api/**` | `tests/api/**/*.test.ts` |
| `src/lib/**` | `src/lib/**/*.test.ts` or `tests/lib/**/*.test.ts` |

## Commands

| Command | Action |
|---------|--------|
| `/workflow.autoQA` | Run automated QA on queue |
| `/workflow.qa` | Manual QA workflow |
| `/workflow.pass <id>` | Manually pass a task |
| `/workflow.fail <id> <reason>` | Manually fail a task |

## Manual Override

When `manualOverride: true` in config:
- `/workflow.qa` still available for manual testing
- `/workflow.pass <id>` - manually pass task
- `/workflow.fail <id> <reason>` - manually fail task

## Hook Integration

Invoked automatically via `.specify/extensions.yml`:
```yaml
after_review:
  - command: workflow.autoQA
    prompt: Test all tasks in QA queue
```

## Error Handling

| Error | Action |
|-------|--------|
| Test runner fails | Treat as FAIL, return to dev |
| No tests found for changed files | FAIL immediately, return to dev with "Tests required" message |
| TypeScript errors | Treat as FAIL, list errors |
| Build timeout | Treat as FAIL, investigate manually |

## Test Requirement Exemptions

The following file types do NOT require tests:
- Type definition files: `*.d.ts`, `types.ts`, `*-types.ts`
- Configuration files: `*.config.ts`, `*.config.js`
- Database migrations: `migrations/**`
- Index/barrel files: `index.ts` (only exports, no logic)
- CSS/styling: `*.css`, `*.scss`, `*.module.css`
- Static assets: `*.json`, `*.md`, `*.txt`

**Decision:** If ALL changed files are exempt types → proceed with PASS
                If ANY non-exempt file lacks tests → FAIL

## Test Execution Examples

```bash
# Run tests related to specific files
npm test -- --findRelatedTests src/components/Form.tsx src/lib/utils.ts

# Run tests matching a pattern
npm test -- --testPathPattern="core-values"

# Run with coverage for affected files
npm test -- --coverage --findRelatedTests <files>

# TypeScript check
npx tsc --noEmit
```
