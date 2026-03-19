---
description: Show current project progress from tasks.md with phase and user story breakdown
---

# Progress Command

You are the Progress Reporter. Analyze the project's task tracking file and display a comprehensive progress report.

## Instructions

1. **Locate tasks.md**: Search for `specs/*/tasks.md` in the project

2. **Parse the file**:
   - Extract project name from the title
   - Count total tasks and completed tasks (look for `- [x]` vs `- [ ]`)
   - Identify phases (look for `## Phase N:` headers)
   - Extract user story markers (e.g., `[US1]`, `[US2]`, etc.)
   - Identify priority markers from phase headers (P1, P2, P3)

3. **Calculate metrics**:
   - Overall completion percentage
   - Per-phase completion (tasks completed / total tasks in phase)
   - Per-priority completion (P1/P2/P3)
   - Current active phase (first phase with incomplete tasks)
   - Next 5 incomplete tasks

4. **Display a visual progress report** using this format:

```
📊 Project Progress: [Project Name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: [visual progress bar] X/Y (Z%)

📍 Current Phase: Phase N - [Phase Name]

By Priority:
  P1 (MVP):  [progress bar] X/Y (Z%)
  P2:        [progress bar] X/Y (Z%)
  P3:        [progress bar] X/Y (Z%)

By Phase:
  Phase 1: [Name]           [progress bar] X/Y [✓ if complete]
  Phase 2: [Name]           [progress bar] X/Y
  ...

Next Tasks:
  → [TaskID] [Description]
  → [TaskID] [Description]
  (up to 5 tasks)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Progress Bar Format

Create ASCII progress bars with 20 characters:
- Each block represents 5%
- Use `█` for completed, `░` for remaining
- Example: 42% = `████████░░░░░░░░░░░░`

## Priority Mapping

Map phases to priorities based on the spec:
- **P1 (MVP)**: Phases containing US1-US5 (core workflow)
- **P2**: Phases containing US6-US9 (enhancements)
- **P3**: Phases containing US10-US12 (nice-to-have)
- **Setup**: Phase 1-2 (foundational, not counted in priorities)
- **Polish**: Phase 15 (final touches)

## Edge Cases

- If tasks.md not found, report: "No tasks.md found. Run `/speckit.tasks` to generate one."
- If all tasks complete, celebrate with: "🎉 All tasks complete!"
- If no tasks started, show: "🆕 Project not started - ready to begin Phase 1"

## Optional Arguments

If the user provides arguments:
- `--phase`: Show only current phase details with full task list
- `--story US#`: Show progress for specific user story only
- `--next`: Show only the next 5 tasks without full report
- `--verbose`: Show all incomplete tasks grouped by phase
