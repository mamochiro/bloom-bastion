# ADR-0003: Wave System Schema + Concrete Waves 1–3

**Date:** 2026-06-07
**Status:** Proposed

## Context

The M1 core loop is complete but runs on a single hardcoded scaffold wave
(`DEFAULT_WAVE` = 5 Grubs @ 0.75s). SPEC §6.3 describes the *shape* of all 20
waves prose-style ("Wave 1-3: Tutorial easy — Grubs only, light Snails") but
defines **no concrete per-wave data**: counts, spawn intervals, group
composition, inter-wave timing, or the data structure waves are authored in.
The real wave system can't be built until those exist — this is the long-tracked
"§6.3 gap." Forces:

- **Mobile-first, tutorial-gentle** — waves 1–3 teach the loop; must be beatable
  with the 150g / 20-lives Normal start (≈3 Blossoms @ 50g) without frustration.
- **Data-driven, not code-driven** — waves are content; they belong in a config
  table (like `enemies.ts`/`towers.ts`), so 4–20 + Endless can be authored
  without touching systems. Balance changes must stay a table edit.
- **Reuse what exists** — the slice already has `SpawnSystemHandle.isComplete()`
  driving win detection and `gameStatus 'won'`. A wave system generalizes "one
  wave complete" → "advance wave; win after the last."
- **Zero hot-path alloc** — spawn scheduling must run off pre-built data with no
  per-frame allocation (SPEC §4.4 discipline).

This ADR fixes the **schema + waves 1–3** (the next buildable increment). Waves
4–20 follow the same schema and are authored incrementally (see Consequences).

## Options Considered

1. **Flat list per wave** — each wave is one `{enemyType, count, interval}`.
   - ✅ Trivial. ❌ Can't express "10 Grubs *then* 3 Snails trailing in," which
     §6.3 needs from wave 3 onward (mixed composition). Too weak.
2. **Wave = ordered list of spawn *groups*** (chosen) — each group is
   `{enemyType, count, intervalS, startDelayS}`; groups overlap/sequence via
   `startDelayS` from wave start.
   - ✅ Expresses pure waves, trailing reinforcements, simultaneous mixes (the
     §6.3 "multiple types simultaneously" for later waves) with one structure.
   - ✅ Pure data; the spawn system just walks group timers. ⚠️ Slightly more
     bookkeeping than option 1 (one timer per active group).
3. **Per-spawn timeline** (explicit `{atTimeS, enemyType}` events) —
   - ✅ Maximal control. ❌ Verbose/unauthorable by hand for 20 waves; overkill.

## Decision

**Adopt option 2.** Wave data lives in a new `src/game/config/waves.ts`:

```ts
interface SpawnGroup {
  enemy: EnemyType;     // §6.2 id (Grub, Snail, …)
  count: number;        // how many to spawn in this group
  intervalS: number;    // seconds between spawns within the group
  startDelayS: number;  // seconds from wave start before the group begins
}
interface Wave { groups: SpawnGroup[]; }   // clear bonus derived: 25 + 5*waveNumber (§6.5)
export const WAVES: readonly Wave[];        // index 0 = wave 1
```

**Spawn/flow changes** (gameplay, no new §4.2 slot):
- `SpawnSystem` becomes wave-driven: tracks `currentWave` + a per-group spawn
  timer; spawns enemies of each group on its schedule. `isWaveComplete()` = all
  groups of `currentWave` fully spawned **and** no enemies alive.
- **Inter-wave:** when a wave is cleared, wait `INTER_WAVE_DELAY_S = 3` (prep
  time), apply the §6.5 wave-clear economy (below), then start the next wave.
  *(Optional follow-up: a "Next Wave" button to call the next wave early —
  matches the deferred §6.4 NEXT button. Not required for this slice.)*
- **Win** (DeathSystem, §6.6): phase → `'won'` when the **last** wave is cleared
  (was: the single scaffold wave). Lose unchanged (lives ≤ 0).
- **Economy on wave clear (§6.5, already specced — wire it now):** `+25 + 5*wave`
  clear bonus, `+5%` of current gold interest (cap +50g). Kill rewards already work.

### Proposed waves 1–3 (Normal difficulty; HP/speed multipliers from §6.5)

Grub = 60 HP / 1.0 spd / 8g · Snail = 180 HP / 0.5 spd / 18g (50% armor).
Blossom = 15 DMG @ 1.2s (≈12.5 DPS) + 40%/2s slow.

| Wave | Groups | Enemies | Spawn window | Clear bonus | Intent |
|------|--------|---------|--------------|-------------|--------|
| **1** | `Grub ×8 @1.0s, delay 0` | 8 Grub | ~7s | 30g | Pure intro — 1 Blossom can almost solo; teaches place→fire→kill→gold. |
| **2** | `Grub ×12 @0.8s, delay 0` | 12 Grub | ~9s | 35g | Density bump — rewards a 2nd tower / first slow-stacking. |
| **3** | `Grub ×10 @0.7s, delay 0` + `Snail ×3 @1.5s, delay 2.0s` | 10 Grub, 3 Snail | ~9s | 40g | Introduce "light Snails" (§6.3) — armored tank trails in; teaches that some enemies soak damage. |

Rationale: each wave is clearable with the starting economy without perfect play;
gold from kills (W1 ≈64g, W2 ≈96g, W3 ≈134g) + clear bonus + interest funds a
2nd–3rd tower by wave 3. Snails (50% armor, slow) introduce the first "you need
more DPS" pressure without a real threat at 3 of them.

## Consequences

- ✅ Unblocks the real wave system — the top remaining M1 item — as a pure
  table + a SpawnSystem generalization (no §4.2 slot, no engine change).
- ✅ Wave 'won' becomes "survive all defined waves," matching §6.6; the existing
  `gameStatus 'won'` + victory overlay + restart all carry over unchanged.
- ✅ Schema absorbs waves 4–20 with zero structural change: boss waves (5/10/15
  Candy King, 20 Neon Dragon) are just a group with `enemy: CandyKing, count: 1`;
  introductions (Flutter@4, Splitter@9, Plushy@14) are new groups. Endless (§6.3)
  scales `count`/HP programmatically over the same `Wave` shape.
- ⚠️ Negative: waves 4–20 still need authoring — this ADR only locks 1–3 + the
  schema. They'll land incrementally (and may want light playtest tuning). Boss
  enemies (Candy King, Neon Dragon) + their phase behavior (§6.2) are a separate
  slice before waves 5/10/15/20 are playable.
- ⚠️ The HP/speed difficulty multipliers (§6.5 Casual/Hardcore) are not applied
  yet (slice hardcodes Normal 1.0×); the wave system should read them when
  difficulty selection lands.
- 🔄 Reversible? Yes — numbers are a `waves.ts` edit; the schema is additive.

<!-- On acceptance: update SPEC §6.3 with the wave schema + the waves 1–3 table,
     add a line to docs/PROGRESS.md decision log, then build the wave system. -->
