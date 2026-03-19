---
description: Developer workflow agent. TRIGGER when: user says "start development", "begin work", "implement task", or invokes /speckit.implement. DO NOT TRIGGER when: user is reviewing code, running QA tests, or checking workflow status. Use when beginning development work on tasks from tasks.md.
---

# Developer Workflow Agent

**Trigger:** `/workflow.dev`

**Purpose:** Manage implementation tasks in the development queue and enforce TDD practices.

## Integration with speckit.implement

This skill integrates with `/speckit.implement` via the `.claude/skills/dev-pipeline/extensions.yml` hook system:
- **before_implement**: Syncs tasks from tasks.md to workflow state
- **after_implement**: Hands off completed task to review queue

## Workflow

1. **Load State**
   - Read `.claude/skills/dev-pipeline/workflow-state.json`
   - Identify current role and tasks in `in_development` queue
   - If called from speckit.implement hook, sync with tasks.md

2. **Sync from tasks.md (Hook Mode)**
   - Read current feature's tasks.md
   - Extract incomplete tasks (lines with `- [ ]`)
   - Add to `not_started` queue if not already tracked
   - Display sync status:
   ```
   === WORKFLOW SYNC ===
   Synced X tasks from tasks.md
   Tasks in not_started: [count]
   Tasks in in_development: [count]
   ```

3. **Display Status**
   ```
   === DEVELOPER WORKFLOW ===
   Current Role: dev
   Tasks in Development: [list or "none"]

   Available Actions:
   1. Continue existing task
   2. Start new task from not_started queue
   3. View task details
   ```

4. **Task Selection**
   - If tasks exist in `in_development`, prompt to continue or start new
   - If starting new, show tasks from `not_started` queue
   - Once selected:
     - Update `assignedRole: "dev"`
     - Update `stage: "in_development"`
     - Record `startedAt` timestamp
     - Update workflow-state.json

5. **Implementation Guidelines**
   - Follow TDD: Write test first, then implement
   - Reference task context from tasks.md
   - Run tests frequently
   - Commit small, focused changes

6. **Completion Actions**
   - Run full test suite: `npm test`
   - If PASS → Mark task for handoff, invoke `/workflow.handoff <taskId>`
   - If FAIL → Display failures, continue development

## State Updates

```json
{
  "taskId": {
    "stage": "in_development",
    "assignedRole": "dev",
    "startedAt": "ISO timestamp",
    "notes": "Implementation notes",
    "source": "tasks.md"
  }
}
```

## Commands

| Command | Action |
|---------|--------|
| `/workflow.dev` | Start dev workflow |
| `/workflow.status` | View all queues |
| `/workflow.handoff <id>` | Move task to review |
| `/workflow.switch reviewer` | Switch to reviewer role |

## Hook Execution Flow

When `/speckit.implement` is invoked:

```
speckit.implement
       │
       ▼
┌─────────────────────────┐
│ before_implement hook   │
│ /workflow.dev           │
│ - Sync tasks from       │
│   tasks.md              │
│ - Set current role      │
│ - Track task progress   │
└─────────────────────────┘
       │
       ▼
[Implementation proceeds]
       │
       ▼
┌─────────────────────────┐
│ after_implement hook    │
│ /workflow.handoff       │
│ - Move to in_review     │
│ - Notify reviewer       │
└─────────────────────────┘
```

## Error Handling

- If workflow-state.json is corrupted, initialize fresh state
- If task not found in tasks.md, prompt user for clarification
- If tests fail, provide detailed failure output and suggested fixes
- If hook mode but no tasks.md, proceed with manual task entry
