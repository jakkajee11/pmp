# Skill Discovery Module

Scans `~/.claude/skills/` directory to discover available skills and their capabilities.

## Purpose

Builds a registry of all available skills by parsing skill names and SKILL.md files.

## Skill Name Patterns

### Framework-Role Pattern
Skills named `{framework}-{role}` indicate framework-specific development skills:
- `nextjs-backend` → framework: nextjs, role: dev, category: backend
- `dotnet-backend` → framework: dotnet, role: dev, category: backend
- `react-frontend` → framework: react, role: dev, category: frontend
- `go-api` → framework: go, role: dev, category: backend

### Role-Type Pattern
Skills named `{category/role}-{type}` indicate cross-cutting skills:
- `backend-reviewer` → role: reviewer, category: backend
- `react-reviewer` → framework: react, role: reviewer
- `dotnet-qa` → framework: dotnet, role: qa

### Detection Regex Patterns

```
# Framework-Role Pattern (for dev skills)
^{framework}-(backend|frontend|api|fullstack)$

# Role-Type Pattern (for reviewer/qa skills)
^{framework}-(reviewer|qa)$
^{category}-(reviewer|qa)$
```

## Discovery Process

### Step 1: Scan Skills Directory
```bash
ls -la ~/.claude/skills/
```

### Step 2: Parse Each Skill
For each directory/symlink:
1. Extract skill name from directory name
2. Read SKILL.md if exists (for description, triggers)
3. Apply regex patterns to categorize
4. Build skill metadata object

### Step 3: Build Registry
```json
{
  "lastScanned": "2026-03-19T15:00:00Z",
  "skillCount": 15,
  "skills": {
    "nextjs-backend": {
      "name": "nextjs-backend",
      "framework": "nextjs",
      "role": "dev",
      "category": "backend",
      "pattern": "framework-role",
      "description": "Next.js backend development specialist",
      "triggers": ["api route", "server action", "middleware"]
    },
    "backend-reviewer": {
      "name": "backend-reviewer",
      "role": "reviewer",
      "category": "backend",
      "pattern": "role-type",
      "description": "Backend code reviewer for security, performance",
      "triggers": ["review code", "check security"]
    }
  },
  "byFramework": {
    "nextjs": ["nextjs-backend"],
    "react": ["react-reviewer"],
    "dotnet": []
  },
  "byRole": {
    "dev": ["nextjs-backend"],
    "reviewer": ["backend-reviewer", "react-reviewer"],
    "qa": []
  }
}
```

## Skill Categorization Logic

```markdown
## Determine Skill Category

1. Check name against framework-role pattern:
   - Extract framework: nextjs, dotnet, go, python, react
   - Extract role: backend, frontend, api, fullstack
   - Set type: dev

2. Check name against role-type pattern:
   - Extract role: reviewer, qa
   - Check for framework prefix: react-reviewer vs backend-reviewer
   - Set category: backend, frontend, or null (generic)

3. Fallback to SKILL.md analysis:
   - Parse description for indicators
   - Look for trigger patterns
```

## Output Files

- `skill-registry.json` - Cached skill registry
- Staleness threshold: 24 hours (re-scan if older)

## Usage in Workflow

```markdown
### In dev.md workflow:

1. Check skill-registry.json exists and is fresh (<24h)
2. If stale or missing, run discovery
3. Use registry to look up skills by framework and role
4. Display resolved skills to user
```

## Framework Detection Patterns

| Framework | Patterns |
|-----------|----------|
| nextjs | nextjs-* |
| react | react-* (but not nextjs) |
| dotnet | dotnet-*, csharp-* |
| go | go-*, golang-* |
| python | python-*, django-*, flask-* |
| rust | rust-* |

## Refresh Triggers

Re-run skill discovery when:
- skill-registry.json is missing
- skill-registry.json is >24 hours old
- User explicitly runs `/workflow.discoverSkills`
- New skill added to ~/.claude/skills/
