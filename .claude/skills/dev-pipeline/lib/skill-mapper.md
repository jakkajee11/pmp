# Skill Mapper Module

Maps detected project frameworks to available skills based on task role and type.

## Purpose

Resolves the appropriate skills to load for a given task based on project context and task requirements.

## Mapping Resolution Process

### Step 1: Load Required Data

```markdown
1. Load project-context.json (from project detector)
2. Load skill-registry.json (from skill discovery)
3. Load skill-mappings.json (configuration)
```

### Step 2: Resolve Skills

```markdown
For a given (role, taskType, frameworks):

1. For each framework in detected frameworks:
   a. Check skill-mappings.json for framework entry
   b. Get skills for role[type] combination
   c. Verify skills exist in skill-registry.json

2. If no framework-specific mapping found:
   a. Use defaultMapping from skill-mappings.json
   b. Fall back to hardcoded defaults

3. Return resolved skill list
```

### Step 3: Display Resolution

```
🔧 Project: Next.js 14.x (App Router)
🔧 Detected frameworks: nextjs, react
🔧 Task type: Backend
🔧 Resolved skills: nextjs-backend

→ Auto-loading nextjs-backend skill
```

## Resolution Logic

### Priority Order

1. **Framework-specific mapping** (highest priority)
   - Exact match in skill-mappings.json
   - e.g., nextjs.dev.backend → ["nextjs-backend"]

2. **Framework fallback**
   - Use framework's default for role
   - e.g., nextjs.dev → check dev.fullstack

3. **Default mapping**
   - Use defaultMapping from config
   - e.g., default.dev.backend → ["backend-reviewer"]

4. **Hardcoded fallback** (lowest priority)
   - Legacy mappings for backwards compatibility
   - backend → ["nextjs-backend"]
   - frontend → ["ui-ux-pro-max"]

### Resolution Algorithm

```markdown
## resolveSkills(role, taskType, frameworks)

result = []

for framework in frameworks:
  # Try exact match
  if mappings[framework][role][taskType] exists:
    skills = mappings[framework][role][taskType]
    result.extend(filterExisting(skills))
    continue

  # Try fullstack fallback
  if taskType != "fullstack" and mappings[framework][role]["fullstack"] exists:
    skills = mappings[framework][role]["fullstack"]
    result.extend(filterExisting(skills))
    continue

  # Try default for framework
  if mappings[framework][role]["*"] exists:
    skills = mappings[framework][role]["*"]
    result.extend(filterExisting(skills))

# If no framework-specific found, use defaults
if result is empty:
  if defaultMapping[role][taskType] exists:
    result.extend(filterExisting(defaultMapping[role][taskType]))
  else:
    result.extend(hardcodedDefaults[taskType])

return unique(result)
```

## Task Type Detection

When task type is unknown, detect from task description:

### Backend Indicators
- Contains "api/", "route.ts", "handlers.ts"
- Contains "server action", "actions.ts"
- Contains "prisma", "db.ts", "database", "schema"
- Contains "middleware", "auth", "authentication"
- Contains "CRUD", "endpoint", "API", "REST"

### Frontend Indicators
- Has [UI/UX] marker
- Contains "component", "page.tsx", "layout.tsx"
- Contains "hook" (client-side), "useState", "useEffect"
- Contains "styling", "CSS", "tailwind", "animation"
- Contains "form", "input", "button", "modal"

### Fullstack
- Contains both backend and frontend indicators

## Example Resolution

### Scenario 1: Next.js Backend Task

```
Input:
  role: dev
  taskType: backend
  frameworks: [nextjs, react]

Resolution:
  1. Check nextjs.dev.backend → ["nextjs-backend"]
  2. Verify nextjs-backend exists in registry → YES
  3. Result: ["nextjs-backend"]
```

### Scenario 2: .NET Backend Task

```
Input:
  role: dev
  taskType: backend
  frameworks: [dotnet]

Resolution:
  1. Check dotnet.dev.backend → ["dotnet-backend"]
  2. Verify dotnet-backend exists in registry → NO
  3. Fall back to default.dev.backend → ["backend-reviewer"]
  4. Result: ["backend-reviewer"]
```

### Scenario 3: Unknown Project Type

```
Input:
  role: dev
  taskType: frontend
  frameworks: []

Resolution:
  1. No framework mappings available
  2. Use default.dev.frontend → ["frontend"]
  3. Verify frontend exists → NO
  4. Use hardcoded: ["ui-ux-pro-max"]
  5. Result: ["ui-ux-pro-max"]
```

## Output Structure

```json
{
  "resolvedAt": "2026-03-19T15:00:00Z",
  "projectContext": {
    "type": "nextjs-app",
    "frameworks": ["nextjs", "react"]
  },
  "mappings": {
    "dev": {
      "backend": ["nextjs-backend"],
      "frontend": ["ui-ux-pro-max"],
      "fullstack": ["nextjs-backend", "ui-ux-pro-max"]
    },
    "reviewer": {
      "backend": ["backend-reviewer"],
      "frontend": ["react-reviewer"],
      "fullstack": ["backend-reviewer", "react-reviewer"]
    },
    "qa": {}
  }
}
```

## Caching

Resolved mappings are cached in workflow-state.json under `resolvedMappings`.
Cache is invalidated when:
- project-context.json is updated
- skill-registry.json is updated
- skill-mappings.json is modified
