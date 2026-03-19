# Workflow Handoff Utility

**Trigger:** `/workflow.handoff [taskId]`

**Purpose:** Transfer a completed development task to the review queue.

## Integration with speckit.implement

This skill is invoked automatically via the `after_implement` hook in `.specify/extensions.yml` when `/speckit.implement` completes.

## Usage

```bash
/workflow.handoff          # Handoff current task (if only one in dev)
/workflow.handoff T093     # Handoff specific task
```

## Workflow

1. **Determine Task**
   - If taskId provided, use that
   - If no taskId, check `in_development` queue
   - If exactly one task in queue, use it
   - If multiple, prompt user to select

2. **Validate Task**
   - Task exists in `in_development` queue
   - Task is assigned to current role (dev)
   - All tests pass (`npm test`)

3. **Pre-Handoff Checks**
   ```bash
   # Run tests
   npm test

   # Run lint
   npm run lint
   ```

   If checks fail:
   ```
   ❌ HANDOFF FAILED

   Tests failed:
   - test/file.spec.ts: Expected X, got Y

   Please fix issues before handoff.
   ```

4. **Update State**
   ```json
   {
     "taskId": {
       "stage": "in_review",
       "assignedRole": "reviewer",
       "handedOffAt": "2026-03-19T12:00:00Z",
       "devNotes": "Implementation complete"
     }
   }
   ```

5. **Queue Operations**
   - Remove from `in_development` queue
   - Add to `in_review` queue
   - Save workflow-state.json

6. **Notification**
   ```
   ✅ HANDOFF SUCCESSFUL

   Task T093 moved to Review Queue
   Reviewer: Use /workflow.switch reviewer then /workflow.reviewer
   ```

## Hook Mode (Called from speckit.implement)

When invoked as an `after_implement` hook:

1. Identify the task(s) just completed by speckit.implement
2. Skip pre-handoff checks (speckit.implement already validated)
3. Move all completed tasks to `in_review` queue
4. Log handoff in workflow history

## Error Handling

| Error | Resolution |
|-------|------------|
| Task not found | Verify task ID exists |
| Task not in dev queue | Task must be in development |
| Tests failing | Fix tests before handoff |
| Lint errors | Fix lint issues before handoff |

## State Transitions

```
in_development → in_review
     (dev)         (reviewer)
```

## Example

```
> /workflow.handoff T093

Running pre-handoff checks...
✓ Tests: 12 passed
✓ Lint: No errors

Updating workflow state...
✓ Task T093 moved to in_review queue

Next steps:
1. Run /workflow.switch reviewer
2. Run /workflow.reviewer to review T093
```
