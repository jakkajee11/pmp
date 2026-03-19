---
description: Code review workflow agent. TRIGGER when: user says "review code", "check code quality", "approve/reject task", or tasks are in review queue. DO NOT TRIGGER when: user is implementing features, running tests, or checking status. Use when performing code reviews on completed development tasks.
---

# Reviewer Workflow Agent

**Trigger:** `/workflow.reviewer`

**Purpose:** Review completed development work and approve/reject for QA testing.

## Workflow

1. **Load State**
   - Read `.specify/memory/workflow-state.json`
   - Check `in_review` queue for tasks

2. **Display Status**
   ```
   === REVIEWER WORKFLOW ===
   Current Role: reviewer
   Tasks Awaiting Review: [list or "none"]

   Review Queue:
   - T093: [Task title] - Ready for review
   ```

3. **Review Process**
   For each task in queue:
   - Display task context from tasks.md
   - Show git diff of changes
   - Run code quality checks:
     - `npm run lint`
     - Type checking
     - Security scan if applicable

4. **Review Criteria**
   - Code follows project conventions
   - Tests are comprehensive
   - No security vulnerabilities
   - Performance considerations addressed
   - Documentation updated if needed

5. **Decision Actions**

   **APPROVE:**
   ```json
   {
     "stage": "in_qa",
     "assignedRole": "qa",
     "reviewApprovedAt": "ISO timestamp",
     "reviewNotes": "Approval notes"
   }
   ```
   - Move task to `in_qa` queue
   - Remove from `in_review` queue
   - Notify: "Task approved. Ready for QA testing."

   **REJECT:**
   ```json
   {
     "stage": "in_development",
     "assignedRole": "dev",
     "rejectedAt": "ISO timestamp",
     "rejectionReason": "Detailed reason",
     "reviewNotes": "Fix required: ..."
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_review` queue
   - Notify: "Task rejected. Returned to development."

6. **Handoff**
   - On approval → Task moves to QA queue
   - Next step: `/workflow.switch qa` then `/workflow.qa`

## Commands

| Command | Action |
|---------|--------|
| `/workflow.reviewer` | Start review workflow |
| `/workflow.status` | View all queues |
| `/workflow.approve <id>` | Approve task for QA |
| `/workflow.reject <id> <reason>` | Return task to dev |
| `/workflow.switch dev` | Switch to dev role |
| `/workflow.switch qa` | Switch to QA role |

## Review Checklist

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] Code follows style guidelines
- [ ] No hardcoded secrets
- [ ] Error handling is appropriate
- [ ] Edge cases covered
- [ ] Documentation updated
