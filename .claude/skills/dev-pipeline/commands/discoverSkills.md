---
description: Scan and discover available skills from ~/.claude/skills/. TRIGGER when: user says "discover skills", "scan skills", "refresh skill registry", or when skill-registry.json is stale/missing.
---

# Discover Skills Command

**Trigger:** `/workflow.discoverSkills`

**Purpose:** Scan `~/.claude/skills/` directory and build a registry of available skills.

## When to Run

- User explicitly invokes `/workflow.discoverSkills`
- `skill-registry.json` is missing
- `skill-registry.json` is older than 24 hours (stale)
- After adding new skills to `~/.claude/skills/`

## Discovery Process

### Step 1: Scan Skills Directory

```bash
ls -la ~/.claude/skills/
```

For each entry:
- Skip if it's a file (not a skill directory)
- Follow symlinks to get actual path
- Extract skill name from directory name

### Step 2: Parse Each Skill

For each skill directory:

1. **Read SKILL.md** (if exists)
   - Extract description from frontmatter or first heading
   - Extract trigger patterns

2. **Parse Skill Name** using patterns:

   **Framework-Role Pattern:**
   ```
   {framework}-(backend|frontend|api|fullstack)
   ```
   Examples:
   - `nextjs-backend` → framework: nextjs, role: dev, category: backend
   - `dotnet-backend` → framework: dotnet, role: dev, category: backend

   **Role-Type Pattern:**
   ```
   {framework}-(reviewer|qa)
   {category}-(reviewer|qa)
   ```
   Examples:
   - `react-reviewer` → framework: react, role: reviewer
   - `backend-reviewer` → category: backend, role: reviewer

3. **Build Skill Metadata:**
   ```json
   {
     "name": "nextjs-backend",
     "framework": "nextjs",
     "role": "dev",
     "category": "backend",
     "pattern": "framework-role",
     "description": "Next.js backend development specialist",
     "triggers": ["api route", "server action"]
   }
   ```

### Step 3: Build Registry Structure

```json
{
  "lastScanned": "2026-03-19T15:00:00Z",
  "skillCount": 15,
  "skills": {
    "skill-name": { /* skill metadata */ }
  },
  "byFramework": {
    "nextjs": ["nextjs-backend"],
    "react": ["react-reviewer"]
  },
  "byRole": {
    "dev": ["nextjs-backend"],
    "reviewer": ["backend-reviewer", "react-reviewer"],
    "qa": []
  }
}
```

### Step 4: Save Registry

Write to `.claude/skills/dev-pipeline/skill-registry.json`

## Framework Detection Patterns

| Pattern | Framework |
|---------|-----------|
| `nextjs-*` | nextjs |
| `react-*` | react |
| `dotnet-*`, `csharp-*` | dotnet |
| `go-*`, `golang-*` | go |
| `python-*`, `django-*`, `flask-*` | python |
| `rust-*` | rust |
| `vue-*` | vue |
| `svelte-*` | svelte |

## Output Display

```
=== SKILL DISCOVERY ===

Scanning ~/.claude/skills/...

Discovered 15 skills:

By Framework:
  nextjs: nextjs-backend
  react: react-reviewer
  dotnet: (none)
  go: (none)

By Role:
  dev: nextjs-backend, ui-ux-pro-max, mcp-builder, ...
  reviewer: backend-reviewer, react-reviewer
  qa: webapp-testing

Registry saved to: .claude/skills/dev-pipeline/skill-registry.json
Last scanned: 2026-03-19T15:00:00Z
```

## Error Handling

- If `~/.claude/skills/` doesn't exist, create minimal registry
- If SKILL.md can't be read, use name-based detection only
- If skill name doesn't match any pattern, categorize as "generic"

## Integration

This command updates `skill-registry.json` which is used by:
- `/workflow.dev` - To resolve skills for task type
- `/workflow.reviewer` - To find reviewer skills
- `/workflow.qa` - To find QA skills
