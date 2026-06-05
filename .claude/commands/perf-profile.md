---
description: Profile game performance
---

Run a performance audit:

1. Build production: `bun run build`
2. Preview: `bun run preview`
3. Check bundle size breakdown: list files in `dist/assets/`
4. Report:
   - Total JS gzipped
   - Total assets
   - Largest 5 files
5. Run Lighthouse via CLI if installed: `npx lighthouse <url> --only-categories=performance --form-factor=mobile`
6. Compare against SPEC §5 targets:
   - FPS 60 mobile
   - Bundle < 400KB JS gzipped
   - FCP < 1.2s
7. Identify any regressions or wins
