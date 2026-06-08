---
description: Create an Architecture Decision Record
argument-hint: "<decision title>"
---

Create a new ADR in `docs/decisions/`:

1. Find next number: count files in `docs/decisions/`, use N+1 zero-padded (e.g. `0003`)
2. Filename: `ADR-NNNN-<kebab-case-title>.md`
3. Title: $ARGUMENTS

Template:
```markdown
# ADR-NNNN: <Title>

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Superseded

## Context
Why are we deciding this now?

## Options Considered
1. Option A — pros / cons
2. Option B — pros / cons
3. Option C — pros / cons

## Decision
What we picked and why.

## Consequences
- ✅ Positive: ...
- ⚠️ Negative: ...
- 🔄 Reversible? Yes/No
```

After creating, also append to CLAUDE.md "Recent Decisions" section 
with a link to the ADR.
