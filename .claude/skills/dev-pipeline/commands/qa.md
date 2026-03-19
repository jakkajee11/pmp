---
description: QA testing workflow agent. TRIGGER when: user says "run QA", "test feature", "verify implementation", or tasks are in QA queue. DO NOT TRIGGER when: user is implementing features, reviewing code, or checking status. Use when performing integration and E2E testing on approved tasks.
---

# QA Workflow Agent

**Trigger:** `/workflow.qa`

**Purpose:** Test approved features through integration and E2E testing before marking complete.

## Workflow

1. **Load State**
   - Read `.claude/skills/dev-pipeline/workflow-state.json`
   - Check `in_qa` queue for tasks

2. **Display Status**
   ```
   === QA WORKFLOW ===
   Current Role: qa
   Tasks Awaiting QA: [list or "none"]

   QA Queue:
   - T095: [Task title] - Approved for testing
   ```

3. **Verify Test Existence (MANDATORY)**

   a. Identify Changed Files
      ```bash
      git diff --name-only HEAD~1 HEAD
      ```

   b. Check Test Coverage
      For each changed source file, verify at least one test file exists:
      - Check patterns: `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx`
      - Check locations: same directory, `tests/` mirror, `__tests__/`

   c. Apply Exemptions
      No tests required for:
      - Type definitions: `*.d.ts`, `types.ts`, `*-types.ts`
      - Config files: `*.config.ts`, `*.config.js`
      - Migrations: `migrations/**`
      - Index files: `index.ts`
      - Styling: `*.css`, `*.scss`, `*.module.css`
      - Static: `*.json`, `*.md`, `*.txt`

   d. Decision
      - ALL files exempt → Proceed to testing
      - ANY non-exempt file missing tests → FAIL immediately

4. **Testing Process**
   For each task in queue:
   - Load task requirements from tasks.md
   - Identify test scenarios from acceptance criteria
   - Execute test suite:
     - Unit tests: `npm test`
     - Integration tests: `npm run test:integration` (if available)
     - E2E tests: `npm run test:e2e` (if available)

5. **QA Checklist**
   - Feature works as specified
   - No regressions in existing functionality
   - Edge cases handled correctly
   - Performance acceptable
   - Accessibility requirements met (if applicable)
   - Cross-browser/device testing (if applicable)

6. **Decision Actions**

   **PASS:**
   ```json
   {
     "stage": "completed",
     "assignedRole": null,
     "qaPassedAt": "ISO timestamp",
     "qaNotes": "Test results summary"
   }
   ```
   - Move task to `completed` queue
   - Update tasks.md: Mark task `[X]` completed
   - Generate completion summary
   - Notify: "Task completed successfully."

   **FAIL:**
   ```json
   {
     "stage": "in_development",
     "assignedRole": "dev",
     "qaFailedAt": "ISO timestamp",
     "qaFailureReason": "Detailed failure description",
     "qaNotes": "Issues found: ..."
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_qa` queue
   - Notify: "Task failed QA. Returned to development."

   **FAIL (No Tests):**
   ```json
   {
     "stage": "in_development",
     "assignedRole": "dev",
     "qaFailedAt": "ISO timestamp",
     "qaFailureReason": "No test files found for changed source files",
     "qaNotes": "Tests are REQUIRED before QA approval.",
     "missingTests": [
       {
         "sourceFile": "src/components/Feature.tsx",
         "expectedTestPatterns": [
           "src/components/Feature.test.tsx",
           "tests/components/Feature.test.tsx"
         ]
       }
     ]
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_qa` queue
   - Notify: "Task failed QA: No tests found. Returned to development."

## Test Execution

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.spec.ts

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm test -- --coverage
```

## Commands

| Command | Action |
|---------|--------|
| `/workflow.qa` | Start QA workflow |
| `/workflow.status` | View all queues |
| `/workflow.pass <id>` | Mark task complete |
| `/workflow.fail <id> <reason>` | Return task to dev |
| `/workflow.switch dev` | Switch to dev role |
| `/workflow.switch reviewer` | Switch to reviewer role |

## Completion Report

When task passes QA, generate:
```
=== TASK COMPLETION REPORT ===
Task ID: T095
Title: [Task title]
Completed: [timestamp]

Summary:
- Development: [dev duration]
- Review: [review duration]
- QA: [qa duration]
- Total: [total duration]

Files Changed:
- [list of modified files]

Tests:
- Unit: X passed
- Integration: Y passed
- E2E: Z passed
```
