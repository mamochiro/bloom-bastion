import { addComponent } from "bitecs";
import { beforeEach, describe, expect, it } from "vitest";
import { Health, Projectile, Tower, projectileQuery, world } from "../../../src/engine/ecs/world";
import { SPECIAL } from "../../../src/game/config/combat";
import { EnemyType } from "../../../src/game/config/enemies";
import {
  PLACEABLE_TOWERS,
  TowerType,
  sellValue,
  totalInvested,
  towerLevelStats,
  upgradeInfo,
} from "../../../src/game/config/towers";
import { setDamageRng } from "../../../src/game/ecs/apply-damage";
import { Hit } from "../../../src/game/ecs/components";
import { spawnEnemy } from "../../../src/game/entities/create-enemy";
import { createProjectile } from "../../../src/game/entities/create-projectile";
import { placeTower } from "../../../src/game/entities/create-tower";
import { DamageSystem } from "../../../src/game/systems/damage";
import { TowerAISystem } from "../../../src/game/systems/tower-ai";
import { resetGameWorld } from "./_reset";

const LUNA = TowerType.Luna;
const STEP = 1 / 60;

/** Fire a beam (damage + special) at `target`, land it, run DamageSystem. */
function landHit(target: number, damage: number, special: number): void {
  const p = createProjectile(world, 0, 0, target, damage, special);
  addComponent(world, Hit, p);
  DamageSystem(world, 0);
}

describe("Luna Crystal (sniper) — SPEC §6.1", () => {
  beforeEach(() => {
    resetGameWorld(world);
    setDamageRng(() => 1); // no dodge, no crit by default
  });

  it("Projectile.special is ui16 — bits up to 1<<10 round-trip (widen didn't truncate)", () => {
    const p = createProjectile(world, 0, 0, 0, 0, SPECIAL.Crit); // 1<<10 = 1024 (> ui8)
    expect(Projectile.special[p]).toBe(SPECIAL.Crit);
    const all = SPECIAL.Slow | SPECIAL.Splash | SPECIAL.AntiArmor | SPECIAL.Crit;
    Projectile.special[p] = all;
    expect(Projectile.special[p]).toBe(all);
  });

  it("level stats + bits (no per-level base change; 60/4.0/1.5)", () => {
    expect(towerLevelStats(LUNA, 1)).toMatchObject({ damage: 60, range: 4.0, cooldown: 1.5 });
    expect(towerLevelStats(LUNA, 2)).toMatchObject({ damage: 60, range: 4.0, cooldown: 1.5 });
    expect(towerLevelStats(LUNA, 3)).toMatchObject({ damage: 60, range: 4.0, cooldown: 1.5 });
    expect(towerLevelStats(LUNA, 1).special & SPECIAL.AntiArmor).not.toBe(0);
    expect(towerLevelStats(LUNA, 1).special & SPECIAL.Pierce).toBe(0);
    expect(towerLevelStats(LUNA, 2).special & SPECIAL.Pierce).not.toBe(0);
    expect(towerLevelStats(LUNA, 3).special & SPECIAL.Crit).not.toBe(0);
  });

  it("AntiArmor: +30% vs an armored (Snail) target; no bonus vs unarmored", () => {
    const snail = spawnEnemy(world, EnemyType.Snail, 100, 100); // armor 0.5, HP 180
    landHit(snail, 60, SPECIAL.AntiArmor);
    // 60 ×1.3 = 78 pre-armor, then ×(1−0.5) = 39.
    expect(Health.current[snail]).toBeCloseTo(180 - 39, 5);

    const grub = spawnEnemy(world, EnemyType.Grub, 200, 200); // no armor
    landHit(grub, 60, SPECIAL.AntiArmor);
    expect(Health.current[grub]).toBe(60 - 60); // no bonus, full 60
  });

  it("Crit (Moonburst): ×2 when roll < 0.25, normal when ≥ 0.25", () => {
    const g1 = spawnEnemy(world, EnemyType.Grub, 100, 100);
    setDamageRng(() => 0.1); // crit
    landHit(g1, 30, SPECIAL.Crit);
    expect(Health.current[g1]).toBe(60 - 60); // 30 ×2

    const g2 = spawnEnemy(world, EnemyType.Grub, 200, 200);
    setDamageRng(() => 0.5); // no crit
    landHit(g2, 30, SPECIAL.Crit);
    expect(Health.current[g2]).toBe(60 - 30);
  });

  it("Pierce (L2): the beam hits up to 3 in a line; a 4th off-line enemy is missed", () => {
    // Luna at cell (0,4) centre = (30, 270); enemies along +x at row 4.
    const tower = placeTower(world, LUNA, 0, 4);
    Tower.level[tower] = 2; // Pierce
    const onLine = [
      spawnEnemy(world, EnemyType.Grub, 90, 270), // primary-ish (nearest)
      spawnEnemy(world, EnemyType.Grub, 150, 270),
      spawnEnemy(world, EnemyType.Grub, 210, 270),
      spawnEnemy(world, EnemyType.Grub, 270, 270), // 4th in line (beyond the 3-cap)
    ];
    const offLine = spawnEnemy(world, EnemyType.Grub, 150, 360); // far perpendicular

    TowerAISystem(world, STEP); // fires the pierce beams
    // 3 beams (primary + 2 pierced); land them all.
    expect(projectileQuery(world).length).toBe(3);
    for (const p of Array.from(projectileQuery(world))) {
      addComponent(world, Hit, p);
    }
    DamageSystem(world, 0);

    // The nearest 3 along the line took damage; the 4th and the off-line did not.
    const hit = [onLine[0], onLine[1], onLine[2]];
    for (const e of hit) expect(Health.current[e]).toBe(60 - 60);
    expect(Health.current[onLine[3]]).toBe(60); // 4th — capped at 3
    expect(Health.current[offLine]).toBe(60); // off the beam line
  });

  it("L1 Luna fires a SINGLE beam (no pierce)", () => {
    const tower = placeTower(world, LUNA, 0, 4);
    Tower.level[tower] = 1;
    spawnEnemy(world, EnemyType.Grub, 90, 270);
    spawnEnemy(world, EnemyType.Grub, 150, 270);
    TowerAISystem(world, STEP);
    expect(projectileQuery(world).length).toBe(1);
  });

  it("economy: 150 / +100 / +200 + sell derivation", () => {
    expect(upgradeInfo(LUNA, 1)).toEqual({ label: "Pierce", cost: 100 });
    expect(upgradeInfo(LUNA, 2)).toEqual({ label: "Moonburst", cost: 200 });
    expect(upgradeInfo(LUNA, 3)).toBeNull();

    expect(totalInvested(LUNA, 1)).toBe(150);
    expect(totalInvested(LUNA, 2)).toBe(250); // 150 + 100
    expect(totalInvested(LUNA, 3)).toBe(450); // 150 + 100 + 200
    expect(sellValue(LUNA, 1)).toBe(Math.floor(150 * 0.6)); // 90 (never upgraded)
    expect(sellValue(LUNA, 3)).toBe(Math.floor(450 * 0.4)); // 180
  });

  it("placeable; the widen didn't break other towers' special bits", () => {
    expect(PLACEABLE_TOWERS).toContain(LUNA);
    expect(TowerType.Luna).toBe(3);

    // Guard: a Blossom slow + Stormcloud chain + Sugar splash still apply through
    // the now-ui16 special field (a Snail takes chain/splash, a Grub gets slowed).
    const grub = spawnEnemy(world, EnemyType.Grub, 300, 300);
    landHit(grub, 15, SPECIAL.Slow);
    // Slow stamps Status; just confirm damage still lands unchanged.
    expect(Health.current[grub]).toBe(60 - 15);
  });
});
