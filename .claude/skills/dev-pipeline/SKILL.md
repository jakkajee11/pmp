# Dev Pipeline

Automated Dev → Review → QA pipeline for managing task implementation workflows.

## Overview

This skill provides a complete workflow management system for software development tasks. It enforces a structured pipeline:

```
not_started → in_development → in_review → in_qa → completed
                   ^               |           |
                   |---------------|-----------|
                     (rejection)    (failure)
```

## State Management

All workflow state is persisted in `workflow-state.json` in this directory. This includes:
- Current role (dev/reviewer/qa)
- Task queues (not_started, in_development, in_review, in_qa, completed)
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

## Automation

The pipeline supports full automation:

1. **Auto-Review**: After handoff, automatically checks:
   - Lint errors (balanced mode - warnings logged, errors fail)
   - Security patterns (hardcoded secrets, SQL injection, XSS, etc.)

2. **Auto-QA**: After review passes, automatically:
   - Verifies test files exist for changed source files
   - Runs affected tests only
   - TypeScript compilation check

## Role Guidelines

### Developer (dev)
- Always write tests first (TDD)
- Run `npm test` before handoff
- Use `/workflow.handoff <taskId>` when complete

### Reviewer (reviewer)
- Check code quality, security, performance
- Approve: moves task to QA
- Reject: returns task to dev with notes

### QA (qa)
- Run integration and E2E tests
- Pass: mark task completed in tasks.md
- Fail: return to dev with failure details

## Hook Integration

Configured in `extensions.yml`:
- `before_implement`: Invokes developer workflow
- `after_implement`: Hands off and triggers auto-review
- `after_review`: Triggers auto-QA

## File Structure

```
.claude/skills/dev-pipeline/
├── SKILL.md              # This file
├── workflow-state.json   # State file
├── extensions.yml        # Hooks config
└── commands/             # Individual workflow commands
    ├── dev.md
    ├── reviewer.md
    ├── qa.md
    ├── status.md
    ├── handoff.md
    ├── switch.md
    ├── autoReview.md
    └── autoQA.md
```

## Quick Start

1. Start development: `/workflow.dev`
2. Implement task with TDD
3. Handoff when done: `/workflow.handoff <taskId>`
4. Pipeline auto-flows: review → QA → completed
5. Check status anytime: `/workflow.status`
