---
description: Developer workflow agent. TRIGGER when: user says "start development", "begin work", "implement task", or invokes /speckit.implement. DO NOT TRIGGER when: user is reviewing code, running QA tests, or checking workflow status. Use when beginning development work on tasks from tasks.md.
---

# Developer Workflow Agent

**Trigger:** `/workflow.dev`

**Purpose:** Manage implementation tasks in the development queue and enforce TDD practices.

## Integration with speckit.implement

This skill integrates with `/speckit.implement` via the `.specify/extensions.yml` hook system:
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

5. **Dynamic Skill Resolution**

   a. **Check Project Context**
      - Read `.claude/skills/dev-pipeline/project-context.json`
      - If missing or stale (>24h), invoke `/workflow.detectProject`
      - Detection sources: CLAUDE.md, package.json, *.csproj, go.mod

   b. **Check Skill Registry**
      - Read `.claude/skills/dev-pipeline/skill-registry.json`
      - If missing or stale (>24h), invoke `/workflow.discoverSkills`
      - Scan: ~/.claude/skills/

   c. **Resolve Skills**
      - Read `.claude/skills/dev-pipeline/skill-mappings.json`
      - Match project frameworks to skill mappings
      - Filter by task type (backend/frontend/fullstack)
      - Verify skills exist in registry
      - Priority: framework-specific → default → hardcoded fallback

   d. **Display Resolution**
      ```
      === SKILL RESOLUTION ===
      🔧 Project: Next.js 14.x (App Router)
      🔧 Detected frameworks: nextjs, react
      🔧 Task type: Backend
      🔧 Resolved: nextjs-backend (from framework mapping)
      🔧 Resolution source: dynamic

      → Auto-loading nextjs-backend skill
      → Skill provides: API route patterns, server actions, middleware, auth, DB integration
      ```

6. **Task Type Detection**
   - Analyze task description for type indicators
   - Detect task type and update task metadata:

   **Backend Indicators:**
   - Contains "api/", "route.ts", "handlers.ts"
   - Contains "server action", "actions.ts"
   - Contains "prisma", "db.ts", "database", "schema"
   - Contains "middleware"
   - Contains "integration test" for API endpoints
   - Contains "CRUD", "endpoint", "API"

   **Frontend Indicators:**
   - Has [UI/UX] marker
   - Contains "component", "page.tsx"
   - Contains "hook" (client-side)
   - Contains "styling", "CSS", "tailwind"

   **Fullstack:**
   - Contains both backend and frontend indicators

   **Auto-Load Actions:**
   ```
   🔧 Backend task detected - auto-loading nextjs-backend skill
   → Skill provides: API route patterns, server actions, middleware, auth, DB integration
   ```
   OR
   ```
   🎨 Frontend task detected - auto-loading ui-ux-pro-max skill
   → Skill provides: Component patterns, styling, UX best practices
   ```
   OR
   ```
   🔄 Fullstack task detected - loading both skills
   → Combined guidance for end-to-end implementation
   ```

7. **Implementation Guidelines**
   - Follow TDD: Write test first, then implement
   - Reference task context from tasks.md
   - Run tests frequently
   - Commit small, focused changes
   - Apply skill-specific patterns from auto-loaded skill

8. **Completion Actions**
   - Run full test suite: `npm test`
   - If PASS → Mark task for handoff, invoke `/workflow.handoff <taskId>`
   - If FAIL → Display failures, continue development

## Skill Resolution Algorithm

```markdown
## resolveSkills(role, taskType, frameworks)

1. Load project-context.json
2. Load skill-registry.json
3. Load skill-mappings.json

4. For each framework in detected frameworks:
   a. Check mappings.frameworkMappings[framework][role][taskType]
   b. If found, verify skills exist in registry
   c. Add to resolved list

5. If no skills found:
   a. Check mappings.defaultMapping[role][taskType]
   b. Verify skills exist in registry
   c. Add to resolved list

6. If still no skills:
   a. Use hardcoded fallback from workflow-state.json skillMapping

7. Return resolved skills with resolution source
```

## Task Type Detection Logic

When analyzing a task, use these patterns:

```markdown
**Backend Keywords:**
- api/route, api/handler, route.ts, handlers.ts
- server action, actions.ts
- prisma, db.ts, database, schema, migration
- middleware, auth, authentication
- integration test (for API), crud, endpoint
- POST, GET, PUT, DELETE, REST

**Frontend Keywords:**
- [UI/UX] marker
- component, page.tsx, layout.tsx
- hook (client-side), useState, useEffect
- styling, CSS, tailwind, animation
- form, input, button, modal
- accessibility, aria

**Detection Priority:**
1. Explicit [UI/UX] marker → Frontend
2. Multiple backend indicators → Backend
3. Multiple frontend indicators → Frontend
4. Mixed indicators → Fullstack
5. No clear indicators → Ask user
```

## State Updates

```json
{
  "taskId": {
    "stage": "in_development",
    "assignedRole": "dev",
    "startedAt": "ISO timestamp",
    "notes": "Implementation notes",
    "source": "tasks.md",
    "type": "backend" | "frontend" | "fullstack",
    "skills": ["nextjs-backend"],
    "resolvedFrom": "dynamic" | "fallback" | "hardcoded"
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
| `/workflow.discoverSkills` | Re-scan available skills |
| `/workflow.detectProject` | Re-detect project type |

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
│ - Detect project type   │
│ - Resolve skills        │
│ - Set current role      │
│ - Track task progress   │
└─────────────────────────┘
       │
       ▼
[Implementation proceeds with resolved skills]
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
- If skill resolution fails, fall back to hardcoded skillMapping

## Fallback Behavior

When dynamic resolution fails:
1. Log warning: "Dynamic skill resolution failed, using fallback"
2. Use skillMapping from workflow-state.json
3. Set `resolvedFrom: "hardcoded"` in task metadata
4. Continue with implementation
