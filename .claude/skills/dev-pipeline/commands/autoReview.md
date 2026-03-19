---
description: Automated code review agent. TRIGGER when: user says "auto review", "run lint check", "check security", or after handoff completes. DO NOT TRIGGER when: user wants manual review, tasks are not in review queue, or user is implementing features. Use for automated lint and security checks on tasks in review queue.
---

# Auto-Review Workflow

**Trigger:** `/workflow.autoReview`

**Purpose:** Automatically review tasks in the review queue using Balanced mode - only errors and security issues fail; warnings are logged.

## Automation Configuration

Loaded from `.claude/skills/dev-pipeline/workflow-state.json`:
```json
{
  "automation": {
    "enabled": true,
    "reviewMode": "balanced",
    "reviewChecks": ["lint-errors", "security"]
  }
}
```

## Workflow

1. **Load State**
   - Read `.claude/skills/dev-pipeline/workflow-state.json`
   - Check `in_review` queue for tasks
   - Load automation configuration

2. **Display Status**
   ```
   === AUTO-REVIEW WORKFLOW ===
   Mode: Balanced (errors + security only)
   Tasks in Queue: X

   Processing review queue...
   ```

3. **Review Process (Per Task)**
   For each task in `in_review` queue:

   a. **Identify Changed Files**
      ```bash
      git diff --name-only HEAD~1 HEAD
      ```

   b. **Run Lint Check (Errors Only)**
      ```bash
      npm run lint 2>&1
      ```
      - Extract ERROR level issues (ignore warnings)
      - Count total errors

   c. **Security Pattern Scan**
      Check for:
      - Hardcoded secrets/credentials (API keys, passwords)
      - SQL injection patterns (string concatenation in queries)
      - XSS vulnerabilities (dangerouslySetInnerHTML without sanitization)
      - Insecure dependencies (npm audit)

      ```bash
      # Check for hardcoded secrets
      grep -rE "(password|api_key|secret|token)\s*=\s*['\"]" --include="*.ts" --include="*.tsx" src/

      # Check for SQL injection patterns
      grep -rE "query\s*\(\s*['\"]\s*SELECT.*\+" --include="*.ts" src/

      # Check for dangerous React patterns
      grep -rE "dangerouslySetInnerHTML" --include="*.tsx" src/

      # Run npm audit for vulnerabilities
      npm audit --audit-level=high
      ```

4. **Decision Logic (Balanced Mode)**

   **PASS Conditions:**
   - No lint ERRORS (warnings logged but don't fail)
   - No security issues found
   - npm audit shows no high/critical vulnerabilities

   **FAIL Conditions:**
   - Any lint ERROR found
   - Any security vulnerability detected
   - High/critical npm audit issues

5. **Result Actions**

   **PASS:**
   ```json
   {
     "stage": "in_qa",
     "reviewPassedAt": "ISO timestamp",
     "reviewMode": "balanced",
     "reviewNotes": "Auto-approved: no errors or security issues",
     "warnings": ["list of non-blocking warnings"]
   }
   ```
   - Move task to `in_qa` queue
   - Remove from `in_review` queue
   - Log: "Task T093 auto-approved for QA"

   **FAIL:**
   ```json
   {
     "stage": "in_development",
     "reviewFailedAt": "ISO timestamp",
     "reviewMode": "balanced",
     "reviewNotes": "Issues found: ...",
     "errors": ["list of blocking errors"],
     "securityIssues": ["list of security problems"]
   }
   ```
   - Move task back to `in_development`
   - Remove from `in_review` queue
   - Log: "Task T093 failed review, returned to development"

6. **Auto-Trigger QA**
   After all reviews complete, if any tasks passed:
   - Automatically invoke `/workflow.autoQA`
   - This creates the full automation pipeline

## Output Format

```
=== AUTO-REVIEW RESULTS ===
Mode: Balanced
Tasks Processed: 8

PASSED (7 tasks):
  T125 - No errors or security issues
  T126 - No errors or security issues
  T127 - No errors or security issues (2 warnings logged)
  T128 - No errors or security issues
  T129 - No errors or security issues
  T130 - No errors or security issues
  T131 - No errors or security issues

FAILED (1 task):
  T132 - 1 security issue: Hardcoded API key in src/lib/api.ts:42

Moving 7 tasks to QA queue...
Triggering auto-QA workflow...
```

## Security Patterns Checked

| Pattern | Regex | Severity |
|---------|-------|----------|
| Hardcoded secrets | `(password\|api_key\|secret\|token)\s*=\s*['"]` | High |
| SQL injection | `query\s*\(\s*['"]\s*SELECT.*\+` | Critical |
| XSS (React) | `dangerouslySetInnerHTML` without sanitization | High |
| Eval usage | `eval\s*\(` | Critical |
| Command injection | `exec\s*\(\s*['"]` | Critical |

## Manual Override

When `manualOverride: true` in config:
- `/workflow.reviewer` still available for manual review
- `/workflow.approve <id>` - manually approve
- `/workflow.reject <id> <reason>` - manually reject

## Hook Integration

Invoked automatically via `.claude/skills/dev-pipeline/extensions.yml`:
```yaml
after_implement:
  - command: handoff
  - command: autoReview
    prompt: Review all tasks in review queue
```

## Error Handling

| Error | Action |
|-------|--------|
| Lint command fails | Treat as FAIL, return to dev |
| Security scan error | Treat as FAIL, investigate manually |
| npm audit fails | Treat as FAIL, list vulnerabilities |
| State file locked | Retry with exponential backoff |
