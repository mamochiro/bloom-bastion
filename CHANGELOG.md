# Changelog

All notable changes to Bloom Bastion are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Project scaffolding docs: `SPEC.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`.
- Claude Code project subagents (`.claude/agents/`) and slash commands (`.claude/commands/`).
- tmux multi-agent orchestration (`scripts/multiagent.sh`, `send-task.sh`, `watch-agents.sh`) with per-agent profiles and `docs/multiagent-guide.md` — orchestrator + engine/gameplay/ui/qa windows.
- GitHub CI workflow (Bun · Biome · tsc · Vitest · build · bundle-size gate).
- ADR process (`docs/decisions/`) — ADR-0001 (stack), ADR-0002 (adopt designer's exported tokens/type).
- **M0 scaffold**: Vite 6 + React 19 + TS strict + Pixi v8 app booting a design-token grid canvas; `tokens.css`/`keyframes.css` mirrored from `design-assets/export/`; Vitest smoke test; `biome.json`, `bunfig.toml`, `.bun-version`. `bun run check` green (~198 KB gzipped JS).

### Changed
- Modernized toolchain: npm + Vite 5 → **Bun (runtime/PM) + Vite 6**; React 18 → 19; added Biome.
- SPEC §2.3/§2.4: colors → design-token family ramps; type → Baloo 2 + Nunito (per ADR-0002).

[Unreleased]: https://github.com/mamochiro/bloom-bastion/commits/main
