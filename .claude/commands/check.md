---
description: Run all checks before committing
---

Run these in order, report results:

1. `bun run lint` (Biome lint + format check)
2. `bun run typecheck` (`tsc --noEmit`)
3. `bun run test` (Vitest unit tests)
4. `bun run build` (production build via Vite)
5. Report bundle size: `du -sh dist/`
6. Verify SPEC.md compliance for current task

If anything fails, STOP and report. Don't try to fix unless asked.
