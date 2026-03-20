# Project Detector Module

Detects project type, framework, and languages from project files and configuration.

## Purpose

Identifies the project's technology stack to enable dynamic skill resolution.

## Detection Priority

### 1. CLAUDE.md Active Technologies (Confidence: 95%)

Parse CLAUDE.md for technology indicators:

```markdown
## Active Technologies
- TypeScript 5.x (strict mode enabled) + Next.js 14.x (App Router)
- PostgreSQL 15.x (primary database)
```

**Extraction Patterns:**
| Pattern | Framework | Confidence |
|---------|-----------|------------|
| `Next.js \d+\.x` | nextjs | 99% |
| `React \d+\.x` | react | 90% |
| `.NET` / `ASP\.NET` | dotnet | 99% |
| `Go \d+` | go | 99% |
| `Python \d+` | python | 95% |
| `Django` | django | 99% |
| `FastAPI` | fastapi | 99% |
| `Rust` | rust | 95% |

### 2. package.json Dependencies (Confidence: 99%)

```json
{
  "dependencies": {
    "next": "14.x"     // → nextjs (99%)
  },
  "devDependencies": {
    "react": "18.x"    // → react (90%)
  }
}
```

**Priority for JS/TS:**
1. `next` present → nextjs
2. `nuxt` present → nuxt
3. `svelte` present → sveltekit
4. `react` + `vite` → react-vite
5. `react` only → react
6. `vue` present → vue
7. `express` present → express

### 3. Project Files (Confidence: 99%)

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

### 4. Directory Structure (Confidence: 70%)

| Directory | Framework Hint |
|-----------|---------------|
| `src/app/` (Next.js App Router) | nextjs |
| `pages/` (Next.js Pages Router) | nextjs |
| `Controllers/`, `Models/` | dotnet |
| `cmd/`, `internal/` | go |
| `app/`, `manage.py` | django |

## Detection Output

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
      "technologies": ["Next.js 14.x", "React 18.x", "PostgreSQL 15.x"]
    },
    "packageJson": {
      "found": true,
      "confidence": 0.99,
      "frameworks": ["next", "react"]
    },
    "projectFiles": {
      "found": false,
      "checked": ["*.csproj", "go.mod", "Cargo.toml"]
    }
  }
}
```

## Detection Algorithm

```markdown
## detectProject()

1. Initialize result object with defaults
2. Check CLAUDE.md
   - If found, extract Active Technologies section
   - Parse for framework patterns
   - Set primary framework if clear match
3. Check package.json
   - If found, scan dependencies
   - Apply priority rules for JS frameworks
   - Merge with CLAUDE.md findings
4. Check project files
   - Look for *.csproj, go.mod, Cargo.toml, etc.
   - If found, set framework (high confidence)
5. Calculate confidence score
   - Multiple sources agreeing → higher confidence
   - Conflicting sources → flag for review
6. Save to project-context.json
```

## Confidence Calculation

```
confidence = (source1_weight * source1_confidence +
              source2_weight * source2_confidence) /
             total_weight

Where:
- CLAUDE.md weight: 0.4
- package.json weight: 0.4
- Project files weight: 0.2

If only one source: confidence = source_confidence * 0.8
```

## Output File

- `project-context.json` - Detected project information
- Staleness threshold: 24 hours (re-detect if older)

## Usage in Workflow

```markdown
### In dev.md workflow:

1. Check project-context.json exists and is fresh (<24h)
2. If stale or missing, run detection
3. Use detected frameworks for skill mapping
4. Display detected project type to user
```

## Refresh Triggers

Re-run project detection when:
- project-context.json is missing
- project-context.json is >24 hours old
- User explicitly runs `/workflow.detectProject`
- CLAUDE.md is modified
- package.json is modified
