import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, Status, Tower, towerQuery, world } from "../../../src/engine/ecs/world";
import { COST_GRASS } from "../../../src/engine/pathfinding/flow-field";
import { SPECIAL } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import {
  TowerType,
  sellValue,
  totalInvested,
  towerLevelStats,
  upgradeInfo,
} from "../../../src/game/config/towers";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { getGold, initResources } from "../../../src/game/ecs/resources";
import { getSelectedTower } from "../../../src/game/ecs/selection";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { placeTower } from "../../../src/game/entities/create-tower";
import { cellIndex, costGrid } from "../../../src/game/map/level-1";
import { DamageSystem } from "../../../src/game/systems/damage";
import { type InputDeps, createInputSystem } from "../../../src/game/systems/input";
import { buildSnapshot } from "../../../src/game/systems/ui-sync";
import { sellTower, upgradeTower } from "../../../src/game/tower-actions";
import { resetGameWorld } from "./_reset";

const STEP = 1 / 60;
const BLOSSOM = TowerType.Blossom;
const STORM = TowerType.Stormcloud;

/** Land a projectile dealing `dmg`+`special` on `target`, then DamageSystem. */
function landHit(target: number, dmg: number, special: number): void {
  const p = createProjectile(world, 0, 0, target, dmg, special);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

/** Full inert InputDeps; override what a test needs. */
function makeInput(over: Partial<InputDeps> = {}): InputDeps {
  return {
    consumeStart: () => false,
    getSelectedDifficulty: () => "normal",
    getStartMode: () => "campaign",
    consumeRestart: () => false,
    consumeSkillActivation: () => null,
    getSkillAim: () => null,
    clearSkillAim: () => {},
    consumeTowerUpgrade: () => false,
    consumeTowerSell: () => false,
    consumeClearSelection: () => false,
    consumeTap: () => false,
    pointerWorldX: () => 0,
    pointerWorldY: () => 0,
    getSelectedBuild: () => null,
    clearBuild: () => {},
    ...over,
  };
}

describe("tower upgrade + sell (SPEC §6.1 / §6.7)", () => {
  beforeEach(() => {
    resetGameWorld(world);
    initResources(world, 1000, 20); // plenty of gold
  });

  it("level-up recomputes TowerAI stats (Blossom L1→L2→L3)", () => {
    expect(towerLevelStats(BLOSSOM, 1)).toMatchObject({ damage: 15, range: 2.5, cooldown: 1.2 });
    expect(towerLevelStats(BLOSSOM, 2)).toMatchObject({ damage: 25, range: 2.8, cooldown: 1.0 });
    expect(towerLevelStats(BLOSSOM, 3)).toMatchObject({ damage: 25, range: 2.8, cooldown: 1.0 });
    // Special bits gain AoeSlow at L3 (always Slow).
    expect(towerLevelStats(BLOSSOM, 1).special & SPECIAL.Slow).not.toBe(0);
    expect(towerLevelStats(BLOSSOM, 1).special & SPECIAL.AoeSlow).toBe(0);
    expect(towerLevelStats(BLOSSOM, 3).special & SPECIAL.AoeSlow).not.toBe(0);

    // Stormcloud: ChainPlus@L2, Stun@L3, +15 DMG.
    expect(towerLevelStats(STORM, 1)).toMatchObject({ damage: 20 });
    expect(towerLevelStats(STORM, 2)).toMatchObject({ damage: 35 });
    expect(towerLevelStats(STORM, 2).special & SPECIAL.ChainPlus).not.toBe(0);
    expect(towerLevelStats(STORM, 3).special & SPECIAL.Stun).not.toBe(0);
  });

  it("upgrade spends gold and bumps level; gold guard blocks when too poor", () => {
    const t = placeTower(world, BLOSSOM, 5, 3);
    expect(Tower.level[t]).toBe(1);

    expect(upgradeTower(world, t)).toBe(true); // L2, −40g
    expect(Tower.level[t]).toBe(2);
    expect(getGold(world)).toBe(1000 - 40);

    expect(upgradeTower(world, t)).toBe(true); // L3, −80g
    expect(Tower.level[t]).toBe(3);
    expect(getGold(world)).toBe(1000 - 40 - 80);

    expect(upgradeTower(world, t)).toBe(false); // already max
    expect(Tower.level[t]).toBe(3);
  });

  it("upgrade is blocked when unaffordable (no spend, no level change)", () => {
    resetGameWorld(world);
    initResources(world, 30, 20); // < 40 (L2 cost)
    const t = placeTower(world, BLOSSOM, 5, 3);

    expect(upgradeTower(world, t)).toBe(false);
    expect(Tower.level[t]).toBe(1);
    expect(getGold(world)).toBe(30);
  });

  it("Stormcloud L3 Overcharge: 20% stun roll via the injected RNG", () => {
    const enemy = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const stun3 = towerLevelStats(STORM, 3).special;

    setDamageRng(() => 0.1); // < 0.2 → stun lands
    landHit(enemy, 35, stun3);
    expect(Status.stunnedUntil[enemy]).toBeGreaterThan(0);

    // Reset the timer; a high roll → no stun.
    Status.stunnedUntil[enemy] = 0;
    setDamageRng(() => 0.5); // ≥ 0.2 → no stun
    landHit(enemy, 35, stun3);
    expect(Status.stunnedUntil[enemy]).toBe(0);
  });

  it("Blossom L3 Petal Storm: AoE damage + slow to up to 3 nearby enemies", () => {
    const aoe = towerLevelStats(BLOSSOM, 3).special;
    const primary = spawnEnemy(world, EnemyType.Grub, 300, 300);
    const n1 = spawnEnemy(world, EnemyType.Grub, 320, 300); // within 1 tile (60px)
    const n2 = spawnEnemy(world, EnemyType.Grub, 300, 330);

    setDamageRng(() => 1); // no dodge
    landHit(primary, 25, aoe);

    // Primary takes 25; the 2 nearby splash for 25 each AND get slowed.
    expect(Health.current[primary]).toBe(60 - 25);
    expect(Health.current[n1]).toBe(60 - 25);
    expect(Health.current[n2]).toBe(60 - 25);
    expect(Status.slowedUntil[n1]).toBeGreaterThan(0);
    expect(Status.slowedUntil[n2]).toBeGreaterThan(0);
  });

  it("sell refund: 60% un-upgraded, 40% if any upgrade (derived from typeId+level)", () => {
    // Blossom invested: L1 50, L2 +40, L3 +80.
    expect(totalInvested(BLOSSOM, 1)).toBe(50);
    expect(totalInvested(BLOSSOM, 2)).toBe(90);
    expect(totalInvested(BLOSSOM, 3)).toBe(170);
    expect(sellValue(BLOSSOM, 1)).toBe(Math.floor(50 * 0.6)); // 30 (never upgraded)
    expect(sellValue(BLOSSOM, 2)).toBe(Math.floor(90 * 0.4)); // 36
    expect(sellValue(BLOSSOM, 3)).toBe(Math.floor(170 * 0.4)); // 68
  });

  it("sellTower refunds gold, frees the cell + rebuilds flow field, releases the tower", () => {
    const t = placeTower(world, BLOSSOM, 5, 3);
    costGrid[cellIndex(5, 3)] = 65535; // simulate the placement wall (COST_BLOCKED)
    const before = getGold(world);

    sellTower(world, t);

    expect(towerQuery(world).length).toBe(0); // released
    expect(getGold(world)).toBe(before + 30); // 60% of 50
    expect(costGrid[cellIndex(5, 3)]).toBe(COST_GRASS); // cell freed
  });

  it("upgradeInfo / selectedTower snapshot reflects level + next upgrade + sellValue", () => {
    const t = placeTower(world, BLOSSOM, 5, 3);
    expect(upgradeInfo(BLOSSOM, 1)).toEqual({ label: "Bigger Bloom", cost: 40 });
    expect(upgradeInfo(BLOSSOM, 3)).toBeNull();

    // Select via the input tap, then check the snapshot mirrors it.
    const sys = createInputSystem(
      makeInput({
        consumeTap: () => true,
        pointerWorldX: () => 5 * 60 + 30,
        pointerWorldY: () => 3 * 60 + 30,
      }),
    );
    sys(world, STEP);
    expect(getSelectedTower()).toBe(t);

    const snap = buildSnapshot(world);
    expect(snap.selectedTower).toEqual({
      eid: t,
      name: "Blossom",
      level: 1,
      upgrade: { label: "Bigger Bloom", cost: 40 },
      sellValue: 30,
    });
  });

  it("input tap resolution: select tower → place → clear", () => {
    initResources(world, 1000, 20);
    // Place a Blossom at (5,3) directly.
    const existing = placeTower(world, BLOSSOM, 5, 3);
    costGrid[cellIndex(5, 3)] = 65535;

    // (a) Tap the tower cell → SELECT it (build intent present but select wins).
    const selectSys = createInputSystem(
      makeInput({
        consumeTap: () => true,
        pointerWorldX: () => 5 * 60 + 30,
        pointerWorldY: () => 3 * 60 + 30,
        getSelectedBuild: () => BLOSSOM,
      }),
    );
    selectSys(world, STEP);
    expect(getSelectedTower()).toBe(existing);
    expect(towerQuery(world).length).toBe(1); // did NOT place a second tower

    // (b) Tap empty grass WITH a build intent → place (and clears selection).
    const placeSys = createInputSystem(
      makeInput({
        consumeTap: () => true,
        pointerWorldX: () => 7 * 60 + 30, // (7,3) grass
        pointerWorldY: () => 3 * 60 + 30,
        getSelectedBuild: () => BLOSSOM,
      }),
    );
    placeSys(world, STEP);
    expect(towerQuery(world).length).toBe(2);
    expect(getSelectedTower()).toBe(-1); // placing cleared selection

    // (c) Re-select then tap empty with NO build → clears selection.
    selectSys(world, STEP); // selects existing again (tap 5,3)
    expect(getSelectedTower()).toBe(existing);
    const clearSys = createInputSystem(
      makeInput({
        consumeTap: () => true,
        pointerWorldX: () => 9 * 60 + 30,
        pointerWorldY: () => 2 * 60 + 30,
      }),
    );
    clearSys(world, STEP);
    expect(getSelectedTower()).toBe(-1);
  });

  it("panel commands (upgrade/sell) act on the selected tower via InputSystem", () => {
    const t = placeTower(world, BLOSSOM, 5, 3);
    costGrid[cellIndex(5, 3)] = 65535;

    // Select it.
    createInputSystem(
      makeInput({
        consumeTap: () => true,
        pointerWorldX: () => 5 * 60 + 30,
        pointerWorldY: () => 3 * 60 + 30,
      }),
    )(world, STEP);

    // Upgrade command.
    createInputSystem(makeInput({ consumeTowerUpgrade: () => true }))(world, STEP);
    expect(Tower.level[t]).toBe(2);
    expect(getGold(world)).toBe(1000 - 40);

    // Sell command → tower gone, gold refunded (40% of 90 = 36), selection cleared.
    createInputSystem(makeInput({ consumeTowerSell: () => true }))(world, STEP);
    expect(towerQuery(world).length).toBe(0);
    expect(getGold(world)).toBe(1000 - 40 + 36);
    expect(getSelectedTower()).toBe(-1);
  });
});
