---
description: Workflow role switcher. TRIGGER when: user says "switch to dev/reviewer/qa", "change role", "become developer", or wants to change active workflow role. Use when changing between developer, reviewer, and QA responsibilities.
---

# Workflow Role Switch Utility

**Trigger:** `/workflow.switch <role>`

**Purpose:** Switch the current active role in the workflow system.

## Available Roles

| Role | Description | Primary Skill |
|------|-------------|---------------|
| `dev` | Developer - implements features | `/workflow.dev` |
| `reviewer` | Reviewer - reviews code | `/workflow.reviewer` |
| `qa` | QA - tests features | `/workflow.qa` |

## Usage

```bash
/workflow.switch dev       # Switch to developer role
/workflow.switch reviewer  # Switch to reviewer role
/workflow.switch qa        # Switch to QA role
```

## Workflow

1. **Validate Role**
   - Check if role is valid (dev/reviewer/qa)
   - Invalid role shows error with available options

2. **Update State**
   ```json
   {
     "currentRole": "reviewer",
     "lastUpdated": "2026-03-19T12:00:00Z"
   }
   ```

3. **Display New Role Context**
   ```
   ✅ ROLE SWITCHED

   Previous Role: dev
   New Role: reviewer

   Tasks in your queue:
   - T094: Add authentication (in_review)

   Next action: /workflow.reviewer
   ```

4. **Record History**
   Add entry to workflow history:
   ```json
   {
     "timestamp": "2026-03-19T12:00:00Z",
     "action": "role_switch",
     "from": "dev",
     "to": "reviewer"
   }
   ```

## Error Handling

```
❌ INVALID ROLE

Role 'admin' is not valid.
Available roles: dev, reviewer, qa

Usage: /workflow.switch <role>
```

## State Persistence

Role is persisted in `.claude/skills/dev-pipeline/workflow-state.json`:
- Survives session restarts
- Shared across parallel sessions

## Example Session

```
> /workflow.switch reviewer

Switching to reviewer role...
✓ Current role updated to: reviewer

Tasks awaiting review:
- T094: Add authentication

Run /workflow.reviewer to start reviewing.
```

## Quick Reference

| Command | Shortcut Effect |
|---------|-----------------|
| `/workflow.switch dev` | Same as starting `/workflow.dev` |
| `/workflow.switch reviewer` | Same as starting `/workflow.reviewer` |
| `/workflow.switch qa` | Same as starting `/workflow.qa` |
