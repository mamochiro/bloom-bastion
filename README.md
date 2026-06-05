<div align="center">

# 🌸 Bloom Bastion

**Mobile-first 2D tower defense — "cute but deadly."**
Pastel + neon glow defenders protect a castle from adorable-but-lethal creatures on a dark, neon-lit battlefield.

</div>

---

## Status

**Pre-implementation** — design complete, M0 (Foundation) in progress. See `SPEC.md` §13 for the roadmap.

## Tech stack

**Bun** (runtime + package manager) · **Vite 6** (bundler/dev) · **TypeScript 5.7** (strict) · **PixiJS v8** (WebGPU-first) · **bitECS** · **Rive** · **GSAP** · **Howler** · **React 19** (HUD overlay only) · **Zustand** · **Biome** · **Vitest + Playwright**.

> Bun runs the toolchain; Vite does the bundling. Why both → `docs/decisions/ADR-0001-tech-stack.md`.

## Quickstart

```bash
bun install      # install deps
bun run dev      # dev server + HMR
bun run check    # lint · typecheck · test · build (pre-commit gate)
```

| Script | Does |
|--------|------|
| `bun run dev` | Vite dev server + HMR |
| `bun run build` | Type-check gate + Vite production build |
| `bun run preview` | Preview the production build |
| `bun run lint` | Biome lint + format check |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Vitest unit tests |
| `bun run test:e2e` | Playwright E2E |

## Project docs

| File | Purpose |
|------|---------|
| [`SPEC.md`](SPEC.md) | Full specification — **source of truth** |
| [`CLAUDE.md`](CLAUDE.md) | Agent memory: locked decisions, current state, rules |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Workflow, commit convention, `gh` flow |
| [`docs/decisions/`](docs/decisions/) | Architecture Decision Records (ADRs) |
| [`design-assets/`](design-assets/) | Designer source: tokens, sprites, mockups (read-only) |

## Performance budget (SPEC §5)

60fps mobile (iPhone 11) · 200+ entities · **< 400KB gzipped JS** (CI hard-fails at 500KB) · FCP < 1.2s · Lighthouse ≥ 90.

## Contributing

We branch from `main` and ship via the `gh` CLI. See [`CONTRIBUTING.md`](CONTRIBUTING.md). CI runs Biome · tsc · Vitest · build · bundle-size gate on every PR.

---

<div align="center"><sub>Build with care. Ship with confidence. 🌸</sub></div>
