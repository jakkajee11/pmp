# QA Workflow Agent

**Trigger:** `/workflow.qa`

**Purpose:** Test approved features through integration and E2E testing before marking complete.

## Workflow

1. **Load State**
   - Read `.specify/memory/workflow-state.json`
   - Check `in_qa` queue for tasks

2. **Display Status**
   ```
   === QA WORKFLOW ===
   Current Role: qa
   Tasks Awaiting QA: [list or "none"]

   QA Queue:
   - T095: [Task title] - Approved for testing
   ```

3. **Testing Process**
   For each task in queue:
   - Load task requirements from tasks.md
   - Identify test scenarios from acceptance criteria
   - Execute test suite:
     - Unit tests: `npm test`
     - Integration tests: `npm run test:integration` (if available)
     - E2E tests: `npm run test:e2e` (if available)

4. **QA Checklist**
   - Feature works as specified
   - No regressions in existing functionality
   - Edge cases handled correctly
   - Performance acceptable
   - Accessibility requirements met (if applicable)
   - Cross-browser/device testing (if applicable)

5. **Decision Actions**

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
