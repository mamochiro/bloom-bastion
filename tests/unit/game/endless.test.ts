/**
 * Endless mode (SPEC §6.3) — the additive procedural slice. Verifies:
 *  - campaign STILL wins at the last authored wave (regression guard);
 *  - endless NEVER wins (no win at the last authored wave; it advances past the
 *    authored set via genEndlessWave and ends ONLY on lives ≤ 0);
 *  - genEndlessWave + endlessHpMult scale count & HP monotonically with n;
 *  - the loss carries score = wavesCleared (highest wave cleared);
 *  - startGame(mode) sets the mode and restart PRESERVES it;
 *  - the UI snapshot exposes mode + score.
 *
 * Mechanics are exercised on small INJECTED wave tables (createSpawnSystem) for
 * speed/determinism; the genEndlessWave/HP formulas are asserted against the
 * live 20-wave base (WAVES.length).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { Health, type World, enemyQuery, world } from "../../../src/engine/ecs/world";
import { EnemyType } from "../../../src/game/config/enemies";
import { WAVES, type Wave, endlessHpMult, genEndlessWave } from "../../../src/game/config/waves";
import { getEndlessHpMult } from "../../../src/game/ecs/endless";
import { getGameMode, getPhase, isEndless, setGameMode } from "../../../src/game/ecs/game-state";
import { getLives, initResources, loseLives } from "../../../src/game/ecs/resources";
import { getClearedWaves } from "../../../src/game/ecs/skills";
import { restartGame, startGame } from "../../../src/game/restart";
import { createDeathSystem } from "../../../src/game/systems/death";
import { type SpawnSystemHandle, createSpawnSystem } from "../../../src/game/systems/spawn";
import { buildSnapshot } from "../../../src/game/systems/ui-sync";
import { resetGameWorld } from "./_reset";

const tiny = (count: number, enemy = EnemyType.Grub): Wave => ({
  groups: [{ enemy, count, intervalS: 0.05, startDelayS: 0 }],
});

/** A death system bound to a specific spawn instance's final-wave state. */
function deathFor(spawn: SpawnSystemHandle) {
  return createDeathSystem(() => spawn.isWaveComplete() && spawn.isLastWave());
}

/** Set every live enemy to 0 HP, then run DeathSystem to reward + recycle them. */
function killAll(death: (w: World, dt: number) => void): void {
  for (const e of Array.from(enemyQuery(world))) Health.current[e] = 0;
  death(world, 0);
}

/** Spawn the whole current wave, clear the board, then let SpawnSystem notice. */
function clearWave(spawn: SpawnSystemHandle, death: (w: World, dt: number) => void): void {
  spawn(world, 100); // emit every enemy of the wave
  killAll(death); // kill them all (DeathSystem releases)
  spawn(world, 0.001); // SpawnSystem notices fully-spawned + empty board
}

/** Sum of all spawn-group counts in a wave. */
const totalCount = (w: Wave): number => w.groups.reduce((s, g) => s + g.count, 0);
/** Sum of just the always-present Grub-core group counts. */
const grubCount = (w: Wave): number =>
  w.groups.filter((g) => g.enemy === EnemyType.Grub).reduce((s, g) => s + g.count, 0);

describe("endless mode", () => {
  beforeEach(() => {
    resetGameWorld(world); // phase → playing, mode → campaign, HP mult → 1.0
    initResources(world); // 150 / 20
  });

  it("campaign STILL wins at the last authored wave (regression)", () => {
    // mode is 'campaign' after reset.
    const spawn = createSpawnSystem([tiny(2), tiny(1)]);
    const death = deathFor(spawn);

    clearWave(spawn, death); // wave 1
    expect(getPhase()).toBe("playing"); // no win mid-campaign
    spawn(world, 3); // → wave 2 (the last authored)
    expect(spawn.isLastWave()).toBe(true);

    spawn(world, 100); // fully spawn the final wave
    killAll(death); // board cleared on the final campaign wave → win
    expect(getPhase()).toBe("won");
    expect(getLives(world)).toBe(20);
  });

  it("endless does NOT win at the last authored wave + advances past it via genEndlessWave", () => {
    setGameMode("endless");
    const spawn = createSpawnSystem([tiny(2), tiny(1)]); // 2 'authored' waves
    const death = deathFor(spawn);

    expect(spawn.isLastWave()).toBe(false); // endless has no last wave, ever

    clearWave(spawn, death); // wave 1
    spawn(world, 3); // → wave 2 (last authored index)
    expect(spawn.getCurrentWave()).toBe(2);
    expect(getPhase()).toBe("playing");

    clearWave(spawn, death); // clear the last AUTHORED wave
    expect(getPhase()).toBe("playing"); // endless never wins here
    spawn(world, 3); // → wave 3 = genEndlessWave (past the authored set)
    expect(spawn.getCurrentWave()).toBe(3);
    expect(getPhase()).toBe("playing");
    spawn(world, 1); // tick past the generated wave's startDelay so it emits
    expect(enemyQuery(world).length).toBeGreaterThan(0); // a real generated wave spawned
  });

  it("arms the endless HP multiplier (>1) once past the authored set", () => {
    setGameMode("endless");
    const spawn = createSpawnSystem([tiny(1)]); // 1 authored wave → next is generated
    const death = deathFor(spawn);

    expect(getEndlessHpMult()).toBe(1); // authored wave: no scaling
    clearWave(spawn, death);
    spawn(world, 3); // → generated wave (index 1, n=1)
    expect(spawn.getCurrentWave()).toBe(2);
    expect(getEndlessHpMult()).toBeCloseTo(1 + 0.15, 5); // §6.3 HP ×1.15ⁿ, n=1
  });

  it("genEndlessWave count + endlessHpMult scale monotonically with n", () => {
    const base = WAVES.length; // 20

    // endlessHpMult is 1.0 across the authored waves, then strictly grows.
    expect(endlessHpMult(0, base)).toBe(1);
    expect(endlessHpMult(base - 1, base)).toBe(1);

    let prevGrub = 0;
    let prevHp = 0;
    for (let k = 0; k < 12; k++) {
      const i = base + k;
      const grub = grubCount(genEndlessWave(i, base));
      const hp = endlessHpMult(i, base);
      expect(grub).toBeGreaterThanOrEqual(prevGrub); // count core never shrinks
      expect(hp).toBeGreaterThan(prevHp); // HP strictly grows each wave
      prevGrub = grub;
      prevHp = hp;
    }
    // Total enemy count grows over a wide span (count ×1.05ⁿ compounds).
    expect(totalCount(genEndlessWave(base + 15, base))).toBeGreaterThan(
      totalCount(genEndlessWave(base, base)),
    );
  });

  it("endless ends on lives 0 with score = wavesCleared", () => {
    setGameMode("endless");
    const spawn = createSpawnSystem([tiny(2), tiny(1)]);
    const death = deathFor(spawn);

    clearWave(spawn, death); // wave 1 cleared → recordWaveCleared(1)
    spawn(world, 3); // → wave 2
    clearWave(spawn, death); // wave 2 cleared → recordWaveCleared(2)
    spawn(world, 3); // → generated wave 3

    expect(getClearedWaves()).toBe(2); // highest wave cleared so far

    loseLives(world, 999); // bastion falls
    death(world, 0); // DeathSystem detects the loss
    expect(getPhase()).toBe("lost");
    // Score headline = highest wave cleared (mirrored into the snapshot).
    expect(buildSnapshot(world).score).toBe(getClearedWaves());
    expect(buildSnapshot(world).score).toBe(2);
  });

  it("startGame(mode) sets the mode; restart PRESERVES it; campaign is the default", () => {
    startGame(world, "normal", "endless");
    expect(getGameMode()).toBe("endless");
    expect(isEndless()).toBe(true);

    restartGame(world); // Play Again
    expect(getGameMode()).toBe("endless"); // mode survives restart
    expect(isEndless()).toBe(true);

    startGame(world, "normal"); // no mode arg → campaign default
    expect(getGameMode()).toBe("campaign");
    expect(isEndless()).toBe(false);
  });

  it("the snapshot exposes mode + score", () => {
    startGame(world, "normal", "endless");
    const snap = buildSnapshot(world);
    expect(snap.mode).toBe("endless");
    expect(snap.score).toBe(0); // fresh run: no waves cleared yet
  });
});
