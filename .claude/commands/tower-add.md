---
description: Add a new tower type to the game
argument-hint: "<tower-name>"
---

Add a new tower called: $ARGUMENTS

Steps:
1. Read SPEC.md §6.1 (Towers) to understand the data shape
2. Add tower config to `src/game/config/towers.ts`
3. Create Rive animation placeholder in `src/assets/rive/`
4. Add tower to tower picker UI in `src/ui/hud/TowerPicker.tsx`
5. Write unit test for tower behavior in `tests/unit/`
6. Update SPEC.md §6.1 table with new tower stats
7. Show me the full diff before committing
