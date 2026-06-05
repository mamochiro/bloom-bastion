---
description: Pull latest context before starting work
---

Read in this order:
1. CLAUDE.md (project memory)
2. SPEC.md sections relevant to current task
3. design-assets/README.md if it exists
4. Recent commits: run `git log --oneline -10`
5. Current git status: run `git status`

Then summarize in 5 lines max:
- Current milestone
- What's been done
- What's next
- Any blockers
- Confirm understanding

End with: "Ready to proceed with: <next task>?"
