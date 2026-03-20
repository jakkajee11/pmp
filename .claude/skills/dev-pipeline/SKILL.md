# Dev Pipeline

Automated Dev → Review → QA pipeline for managing task implementation workflows with dynamic skill resolution.

## Overview

This skill provides a complete workflow management system for software development tasks. It enforces a structured pipeline:

```
not_started → in_development → in_review → in_qa → completed
                   ^               |           |
                   |---------------|-----------|
                     (rejection)    (failure)
```

## Version 3.0 Features

### Dynamic Skill Resolution

The pipeline now automatically detects your project type and resolves appropriate skills:

1. **Project Detection** - Analyzes CLAUDE.md, package.json, and project files
2. **Skill Discovery** - Scans ~/.claude/skills/ for available skills
3. **Smart Mapping** - Matches project frameworks to specialized skills

```
=== SKILL RESOLUTION ===
🔧 Project: Next.js 14.x (App Router)
🔧 Detected frameworks: nextjs, react
🔧 Task type: Backend
🔧 Resolved: nextjs-backend (from framework mapping)
```

## State Management

All workflow state is persisted in `workflow-state.json` in this directory. This includes:
- Current role (dev/reviewer/qa)
- Task queues (not_started, in_development, in_review, in_qa, completed)
- Project context (detected frameworks, languages)
- Resolved skill mappings
- Automation settings
- History of all workflow actions

## Available Commands

| Command | Description |
|---------|-------------|
| `/workflow.dev` | Start developer workflow |
| `/workflow.reviewer` | Start reviewer workflow |
| `/workflow.qa` | Start QA workflow |
| `/workflow.status` | View all queues and task status |
| `/workflow.handoff [id]` | Handoff task to review |
| `/workflow.switch <role>` | Switch current role |
| `/workflow.autoReview` | Run automated code review |
| `/workflow.autoQA` | Run automated QA tests |
| `/workflow.detectType <id>` | Manually detect and set task type |
| `/workflow.discoverSkills` | Scan and register available skills |
| `/workflow.detectProject` | Detect project type and frameworks |

## Dynamic Skill Resolution

### How It Works

1. **Project Detection** (`/workflow.detectProject`)
   - Reads CLAUDE.md for Active Technologies
   - Parses package.json dependencies
   - Checks for project files (*.csproj, go.mod, Cargo.toml)
   - Outputs to `project-context.json`

2. **Skill Discovery** (`/workflow.discoverSkills`)
   - Scans `~/.claude/skills/` directory
   - Parses skill names for framework/role patterns
   - Builds `skill-registry.json`

3. **Skill Mapping** (`skill-mappings.json`)
   - Framework-specific skill assignments
   - Role-based skill selection (dev/reviewer/qa)
   - Task type filtering (backend/frontend/fullstack)

### Supported Frameworks

| Framework | Dev Skills | Reviewer Skills |
|-----------|------------|-----------------|
| nextjs | nextjs-backend, ui-ux-pro-max | backend-reviewer, react-reviewer |
| dotnet | dotnet-backend | dotnet-reviewer |
| go | go-backend | go-reviewer |
| python | python-backend | python-reviewer |
| rust | rust-backend | rust-reviewer |

### Skill Name Patterns

- **Framework-Role**: `nextjs-backend`, `dotnet-reviewer`
- **Role-Type**: `backend-reviewer`, `react-reviewer`
- **Generic**: `webapp-testing`, `ui-ux-pro-max`

## Automation

The pipeline supports full automation:

1. **Auto-Review**: After handoff, automatically checks:
   - Lint errors (balanced mode - warnings logged, errors fail)
   - Security patterns (hardcoded secrets, SQL injection, XSS, etc.)

2. **Auto-QA**: After review passes, automatically:
   - Verifies test files exist for changed source files
   - Runs affected tests only
   - TypeScript compilation check

3. **Dynamic Skill Auto-Load**: When starting development:
   - Detects project type automatically
   - Resolves framework-specific skills
   - Loads appropriate skills for task type

## Task Type Detection

The pipeline automatically detects task types based on keywords:

| Type | Indicators |
|------|------------|
| Backend | api/, route.ts, server action, prisma, middleware, CRUD, endpoint |
| Frontend | [UI/UX] marker, component, page.tsx, styling, CSS |
| Fullstack | Mixed backend and frontend indicators |

Detection happens during `/workflow.dev` and the task type is stored in workflow state.

## Role Guidelines

### Developer (dev)
- Always write tests first (TDD)
- Run `npm test` before handoff
- Use `/workflow.handoff <taskId>` when complete
- Skills auto-resolved based on project type

### ⚠️ MANDATORY SKILL DELEGATION

**CRITICAL RULE: All implementation code MUST be delegated to appropriate skills.**

The agent running dev-pipeline is **NOT permitted to write code directly**. Instead:

1. **Skill Resolution is MANDATORY** - Every task must resolve to at least one skill
2. **Use Skill Tool** - All code generation must come from invoking the Skill tool
3. **No Direct Edits** - The pipeline agent orchestrates but does not implement

**Correct Pattern:**
```
1. Resolve task → Detect type (frontend/backend/fullstack)
2. Resolve skills → ui-ux-pro-max, nextjs-backend, etc.
3. Invoke Skill tool → Skill generates code
4. Review skill output → Apply changes via skill
```

**Incorrect Pattern (FORBIDDEN):**
```
1. Resolve task
2. Write/Edit code directly with Edit/Write tools
```

**Enforcement:**
- If no skill matches, STOP and ask user
- If skill invocation fails, report error and halt
- Task markers like [UI/UX] MUST trigger ui-ux-pro-max skill
- Backend indicators MUST trigger appropriate backend skill

### Reviewer (reviewer)
- Check code quality, security, performance
- Approve: moves task to QA
- Reject: returns task to dev with notes
- Reviewer skills auto-resolved

### QA (qa)
- Run integration and E2E tests
- Pass: mark task completed in tasks.md
- Fail: return to dev with failure details
- QA skills auto-resolved

## Hook Integration

Configured in `.specify/extensions.yml`:
- `before_implement`: Invokes developer workflow with skill resolution
- `after_implement`: Hands off and triggers auto-review
- `after_review`: Triggers auto-QA

## File Structure

```
.claude/skills/dev-pipeline/
├── SKILL.md              # This file
├── workflow-state.json   # State file (v3.0 schema)
├── skill-mappings.json   # Framework-to-skill mappings
├── skill-registry.json   # Cached discovered skills
├── project-context.json  # Detected project info
├── lib/                  # Resolution modules
│   ├── skill-discovery.md
│   ├── project-detector.md
│   └── skill-mapper.md
└── commands/             # Individual workflow commands
    ├── dev.md
    ├── reviewer.md
    ├── qa.md
    ├── status.md
    ├── handoff.md
    ├── switch.md
    ├── autoReview.md
    ├── autoQA.md
    ├── discoverSkills.md
    └── detectProject.md

.specify/
└── extensions.yml        # Hooks config (project-level)
```

## Quick Start

1. Start development: `/workflow.dev`
2. Project is auto-detected, skills resolved
3. Implement task with TDD
4. Handoff when done: `/workflow.handoff <taskId>`
5. Pipeline auto-flows: review → QA → completed
6. Check status anytime: `/workflow.status`

## Manual Commands

Force re-detection:
```
/workflow.discoverSkills   # Re-scan skills directory
/workflow.detectProject    # Re-detect project type
```

## Configuration Files

- `skill-mappings.json` - Customize framework-to-skill mappings
- `skill-registry.json` - Auto-generated skill cache (24h TTL)
- `project-context.json` - Auto-generated project info (24h TTL)
