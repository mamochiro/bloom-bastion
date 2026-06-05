<!-- Bloom Bastion PR. Keep it small and single-purpose (CLAUDE.md working agreements). -->

## What & why
<!-- One paragraph: what this changes and the motivation. -->

## Milestone / SPEC reference
<!-- e.g. M1 — Core Loop · SPEC §6.1 Towers -->

## Type
- [ ] Engine (`src/engine/`)
- [ ] Gameplay (`src/game/`)
- [ ] UI (`src/ui/`, `src/store/`)
- [ ] Tests
- [ ] Docs / config
- [ ] ADR (link below)

## Checklist
- [ ] `bun run check` passes (lint · typecheck · test · build)
- [ ] No locked-decision / forbidden-list violations (CLAUDE.md, SPEC §3.2)
- [ ] No hardcoded colors/spacing/fonts — uses design tokens
- [ ] Game state stays in ECS (not React/Zustand); no allocations in hot path
- [ ] Numbers match SPEC §6 (if balance/config changed, SPEC table updated too)
- [ ] Tests added/updated for logic-heavy changes
- [ ] Bundle within budget (CI gate < 500KB gzipped JS)
- [ ] `spec-reviewer` agent run for non-trivial changes

## ADR
<!-- Required if this changes a locked decision: link docs/decisions/ADR-NNNN-*.md -->

## Screenshots / perf notes
<!-- UI: before/after. Perf-sensitive: FPS / bundle numbers (perf-guardian). -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
