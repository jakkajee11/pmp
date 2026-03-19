---
description: Detect project type and frameworks from configuration files. TRIGGER when: user says "detect project", "what framework", "analyze project", or when project-context.json is stale/missing.
---

# Detect Project Command

**Trigger:** `/workflow.detectProject`

**Purpose:** Analyze project files to detect framework, language, and technology stack.

## When to Run

- User explicitly invokes `/workflow.detectProject`
- `project-context.json` is missing
- `project-context.json` is older than 24 hours (stale)
- After modifying `CLAUDE.md` or `package.json`

## Detection Priority

### 1. CLAUDE.md Active Technologies (Weight: 40%)

Look for the `## Active Technologies` section:

```markdown
## Active Technologies
- TypeScript 5.x (strict mode enabled) + Next.js 14.x (App Router), React 18.x, Prisma 5.x
- PostgreSQL 15.x (primary database), Amazon S3 (file uploads)
```

**Extraction Patterns:**
| Pattern in Text | Detected Framework | Confidence |
|-----------------|-------------------|------------|
| `Next.js \d+\.x` | nextjs | 99% |
| `React \d+\.x` | react | 90% |
| `.NET` / `ASP.NET` | dotnet | 99% |
| `Go \d+` | go | 99% |
| `Python \d+` | python | 95% |
| `Django` | django | 99% |
| `FastAPI` | fastapi | 99% |
| `Rust` | rust | 95% |
| `Vue \d+` | vue | 99% |
| `Svelte` | svelte | 95% |

### 2. package.json Dependencies (Weight: 40%)

```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.0.0",
    "@prisma/client": "5.0.0"
  }
}
```

**Priority Rules for JS/TS:**
1. `next` present → nextjs (99%)
2. `nuxt` present → nuxt (99%)
3. `svelte` + `@sveltejs/kit` → sveltekit (99%)
4. `react` + `vite` → react-vite (90%)
5. `react` only → react (80%)
6. `vue` present → vue (99%)
7. `express` present → express (90%)

### 3. Project Files (Weight: 20%)

| File Pattern | Framework | Confidence |
|--------------|-----------|------------|
| `*.csproj` | dotnet | 99% |
| `*.sln` | dotnet | 99% |
| `go.mod` | go | 99% |
| `Cargo.toml` | rust | 99% |
| `requirements.txt` | python | 80% |
| `pyproject.toml` | python | 95% |
| `Gemfile` | ruby | 99% |
| `composer.json` | php | 99% |
| `pom.xml` | java/maven | 99% |
| `build.gradle` | java/gradle | 99% |

## Detection Algorithm

```
function detectProject():
  result = {
    frameworks: [],
    languages: [],
    databases: [],
    confidence: 0
  }

  # Check CLAUDE.md
  claudeMd = parseClaudeMd()
  if claudeMd.technologies:
    result.frameworks.extend(extractFrameworks(claudeMd.technologies))
    result.languages.extend(extractLanguages(claudeMd.technologies))

  # Check package.json
  pkg = parsePackageJson()
  if pkg:
    result.frameworks.extend(detectJsFrameworks(pkg.dependencies))
    result.frameworks = mergeAndDedupe(result.frameworks)

  # Check project files
  for file in ['*.csproj', 'go.mod', 'Cargo.toml']:
    if exists(file):
      result.frameworks.push(detectFromFile(file))
      break  # Only one typically exists

  # Calculate confidence
  result.confidence = calculateConfidence(sources)

  # Determine primary type
  result.type = determineProjectType(result.frameworks)

  return result
```

## Output Structure

```json
{
  "type": "nextjs-app",
  "frameworks": ["nextjs", "react"],
  "languages": ["typescript"],
  "databases": ["prisma", "postgresql"],
  "packageManager": "npm",
  "detectedAt": "2026-03-19T15:00:00Z",
  "confidence": 0.98,
  "sources": {
    "claudeMd": {
      "found": true,
      "confidence": 0.95,
      "technologies": ["Next.js 14.x", "React 18.x", "Prisma 5.x"]
    },
    "packageJson": {
      "found": true,
      "confidence": 0.99,
      "dependencies": { "next": "14.x", "react": "18.x" }
    },
    "projectFiles": {
      "found": false,
      "checked": ["*.csproj", "go.mod", "Cargo.toml"]
    }
  }
}
```

## Output Display

```
=== PROJECT DETECTION ===

Sources analyzed:
  ✓ CLAUDE.md (confidence: 95%)
  ✓ package.json (confidence: 99%)
  ✗ Project files (not found)

Detected:
  Type: nextjs-app
  Frameworks: nextjs, react
  Languages: typescript
  Databases: prisma, postgresql

Resolved skill mappings:
  dev.backend: nextjs-backend
  dev.frontend: ui-ux-pro-max
  reviewer.backend: backend-reviewer
  reviewer.frontend: react-reviewer

Context saved to: .claude/skills/dev-pipeline/project-context.json
Confidence: 98%
```

## Project Type Determination

| Frameworks | Type |
|------------|------|
| nextjs | nextjs-app |
| react (only) | react-app |
| dotnet | dotnet-api |
| go | go-api |
| django, fastapi | python-api |
| rust | rust-project |

## Error Handling

- If no sources found, set `type: "unknown"` and `confidence: 0`
- If sources conflict, use highest confidence source
- Always save a result (even if empty) to prevent repeated failures

## Integration

This command updates `project-context.json` which is used by:
- `/workflow.dev` - To resolve skills based on project type
- Skill Mapper - To look up framework-specific skills
