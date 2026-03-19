# Workflow Status Utility

**Trigger:** `/workflow.status`

**Purpose:** Display current workflow state, all queues, and task assignments.

## Output Format

```
╔══════════════════════════════════════════════════════════════╗
║                  WORKFLOW STATUS REPORT                       ║
╠══════════════════════════════════════════════════════════════╣
║ Current Role: dev                                             ║
║ Last Updated: 2026-03-19T12:00:00Z                           ║
╚══════════════════════════════════════════════════════════════╝

┌─ NOT STARTED ─────────────────────────────────────────────────┐
│ (empty)                                                       │
└───────────────────────────────────────────────────────────────┘

┌─ IN DEVELOPMENT ──────────────────────────────────────────────┐
│ T093: Implement feature X [dev] Started: 10:00               │
└───────────────────────────────────────────────────────────────┘

┌─ IN REVIEW ───────────────────────────────────────────────────┐
│ T094: Add authentication [reviewer] Since: 11:00             │
└───────────────────────────────────────────────────────────────┘

┌─ IN QA ───────────────────────────────────────────────────────┐
│ T095: Fix login bug [qa] Since: 11:30                        │
└───────────────────────────────────────────────────────────────┘

┌─ COMPLETED ───────────────────────────────────────────────────┐
│ T091: Setup database [✓] Completed: 2026-03-18               │
│ T092: Create models [✓] Completed: 2026-03-18                │
└───────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════
QUEUE SUMMARY
═════════════════════════════════════════════════════════════════
Not Started:    0 tasks
In Development: 1 task
In Review:      1 task
In QA:          1 task
Completed:      2 tasks
────────────────────────────────────────────────────────────────
Total:          5 tasks
═════════════════════════════════════════════════════════════════
```

## Actions

| Command | Description |
|---------|-------------|
| `/workflow.dev` | Switch to developer mode |
| `/workflow.reviewer` | Switch to reviewer mode |
| `/workflow.qa` | Switch to QA mode |
| `/workflow.switch <role>` | Switch to specific role |

## Implementation

1. Read `.specify/memory/workflow-state.json`
2. Parse all queues and tasks
3. Format output with emoji indicators
4. Show task counts and summaries
5. Display available actions based on current role
