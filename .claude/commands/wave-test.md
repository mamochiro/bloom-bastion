---
description: Test a specific wave configuration
argument-hint: "<wave-number>"
---

Test wave $ARGUMENTS:

1. Read wave config from `src/game/config/waves.ts`
2. Start dev server if not running: `bun run dev`
3. Open game, fast-forward to wave $ARGUMENTS
4. Observe and report:
   - Enemy count and types
   - Difficulty feel (too easy / fair / too hard)
   - FPS during wave
   - Any visual or audio issues
5. Suggest balance changes if needed
