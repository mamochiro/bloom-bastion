# ADR-0002: Adopt the designer's exported tokens & type as visual source of truth

**Date:** 2026-06-05
**Status:** Accepted

## Context
The design handoff in `design-assets/` is more detailed and authoritative than the draft values in `SPEC.md` §2.3–2.4. CLAUDE.md already declares `design-assets/` the design source of truth. Reviewing the handoff surfaced concrete mismatches:

- **Colors**: SPEC drafted single tokens (`--tower-blossom: #FFB3D9`) with approximate hexes. The export (`design-assets/export/design-tokens.css`) defines **family ramps** (`--blossom-light/mid/dark`, etc.) with different, final hexes (e.g. `--bg-deep: #1a0f2e`), plus HP ramp, text scale, radii, 8pt spacing, shadows, and `--touch: 56px`.
- **Type**: SPEC drafted Fredoka/Quicksand + Inter + JetBrains Mono. The export uses **Baloo 2** (display/numbers) + **Nunito** (body).
- **Animation**: `design-assets/export/keyframes.css` ships 22 named keyframes matching SPEC §2.5 intent.
- **Field geometry** (from the prototype): battlefield **780×500**, **60px cells**, ~**13×8** grid.

The designer also shipped a playable DOM/React/SVG prototype (`proto_*.jsx`, `sprites_*.jsx`) and 145 screenshots — these are the look/feel/logic reference, not reusable code (production is PixiJS canvas + bitECS).

## Options Considered
1. **Keep SPEC's drafted tokens** — rejected; contradicts the source of truth and the final designs.
2. **Adopt the export as canonical; SPEC references it** — chosen.
3. **Duplicate all token values into SPEC** — rejected; invites drift. SPEC summarizes and points to the file.

## Decision
- The **canonical design tokens** are `design-assets/export/design-tokens.css` and `design-assets/export/keyframes.css`.
- Copy them into `src/ui/styles/tokens.css` and `src/ui/styles/keyframes.css`; all UI references CSS vars from there. No hardcoded colors/spacing/fonts.
- Update **SPEC §2.3** (color system → family ramps + canonical-file pointer) and **SPEC §2.4** (type → Baloo 2 / Nunito).
- Record **field geometry** (780×500, 60px cells) as the gameplay grid baseline.
- The prototype + screenshots are the per-milestone fidelity reference for `ui-dev` and `gameplay-dev`.

## Open scope decisions (NOT decided here — deferred, pending user confirmation)
The prototype implements features that SPEC §15 currently lists as out-of-scope or different. These are flagged for a follow-up decision and are **not** changed by this ADR:
- **Audio**: prototype uses a *procedural Web Audio engine* (`proto_audio.js`, zero asset bytes) vs SPEC §9 (Howler + WebM/Opus assets). Procedural is a large bundle win — candidate for its own ADR.
- **Biomes/maps**: prototype defines **4** (Meadow, Frostpeak, Emberfall, Sugarrush) vs SPEC §15 "1 map in v1".
- **Difficulty names**: prototype uses **Sprout / Bloom / Bastion** vs SPEC §6.5 Casual / Normal / Hardcore.
- **Meta-progression**: prototype has gems, tower skins, perks, daily challenge, 10 achievements — partly post-v1 per SPEC §15.
- **i18n**: prototype settings offer 5 languages (incl. ไทย, 日本語) vs SPEC §15 "English only v1".

## Consequences
- ✅ UI built on the real palette/type from day one; no rework when SPEC drift is noticed later.
- ✅ Single token source (`tokens.css` synced from `export/`) — no duplication drift.
- ⚠️ SPEC §2.3/§2.4 change; downstream references (mockup fidelity checks) use the new ramps.
- ⚠️ Tower color usage shifts from one var to a 3-stop ramp per family — components must pick light/mid/dark intentionally.
- 🔄 Reversible? Yes, but no reason to — these are the final designs.
