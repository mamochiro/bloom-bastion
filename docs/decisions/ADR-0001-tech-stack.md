# ADR-0001: Runtime & build toolchain — Bun runtime + Vite 6 bundler

**Date:** 2026-06-05
**Status:** Accepted

## Context
Bloom Bastion is a mobile-first PixiJS + React + Rive web game with a hard performance budget (60fps mobile, <400KB gzipped JS). We need to lock a runtime, package manager, and build pipeline. The question raised: "use Bun for important processes — or is Vite better?"

The confusion is category: **Bun is a runtime + package manager** (a Node.js replacement); **Vite is a dev server + bundler that runs on a runtime**. They overlap only in the bundler role.

## Options Considered
1. **npm + Vite 5** (original SPEC) — safe, mature, but slow installs; older versions.
2. **Full Bun toolchain (drop Vite)** — Bun owns runtime, bundler, dev server, tests. Most minimal, but Bun's frontend bundler lacks Vite's HMR maturity, plugin ecosystem (PWA, `.riv`/`.webm` assets), and Rollup manual-chunking needed to hit the <400KB budget.
3. **Bun runtime + Vite 6 bundler** — Bun for install/runtime/scripts (strictly faster); Vite for dev server + production bundling (strictly better for this stack). Vite runs *on top of* Bun.

## Decision
**Option 3.** Bun (1.2+) is the runtime and package manager; Vite 6 stays as the dev server and production bundler. Unit tests use **Vitest** (on the Bun runtime) for its Vite transform + jsdom/canvas-mock support; Playwright for E2E. Lint/format via **Biome** (replaces ESLint+Prettier). UI on **React 19**. Game libs (Pixi v8, bitECS, Rive, GSAP, Howler, Zustand) tracked at latest.

Use Bun where it is strictly faster (installs, running scripts/tooling) and Vite where it is strictly better (HMR, asset plugins, chunking). This is the lowest-risk modernization — no architecture changes.

## Consequences
- ✅ Faster installs (10–25× npm) and script startup; modern React 19 / TS 5.7; single fast linter.
- ✅ Keep Vite's HMR, plugin ecosystem, and manual-chunk caching that the perf budget depends on.
- ✅ Commit `bun.lockb`; CI uses `oven-sh/setup-bun`.
- ⚠️ Two tools to understand (Bun + Vite) instead of one. Mitigated by clear role split documented in SPEC §3 and CLAUDE.md.
- ⚠️ Some npm-centric docs/CI snippets need Bun equivalents.
- 🔄 Reversible? Yes — could fall back to npm or move to Bun-native bundler later, but no current reason to.
