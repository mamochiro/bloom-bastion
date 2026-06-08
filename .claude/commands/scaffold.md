---
description: Scaffold the Bloom Bastion project per SPEC.md
---

Set up the project from scratch (Bun runtime + Vite 6 bundler):

1. Run: `bun create vite@latest . --template react-ts` (in current dir)
2. Install dependencies (Bun is the package manager — produces `bun.lockb`):
   - `bun add pixi.js bitecs @rive-app/canvas gsap howler zustand`
   - `bun add -d @types/howler vitest @playwright/test @biomejs/biome @vitejs/plugin-react`
   - Init Biome: `bunx @biomejs/biome init` → creates `biome.json`
3. Create folder structure per SPEC.md §10:
   - `src/engine/{ecs,renderer,pool,pathfinding,audio,input}`
   - `src/game/{systems,entities,config,maps}`
   - `src/ui/{menus,hud,styles}`
   - `src/store`
   - `src/assets/{sprites,rive,audio,fonts}`
   - `tests/{unit,e2e}`
   - `docs/decisions`
4. Copy `design-assets/design-tokens.css` to `src/ui/styles/tokens.css` if exists
5. Update `vite.config.ts` per SPEC §11.2 (manual chunks, asset includes)
6. Update `tsconfig.json` to strict mode
7. Create `src/main.ts` as entry point
8. Run `bun run dev` and verify it boots
9. Report: bundle size, dev server URL, any warnings

DO NOT implement game logic yet. Just scaffold.
