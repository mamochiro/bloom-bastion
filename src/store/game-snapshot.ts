import { create } from "zustand";
// Run-mode type — single source of truth is the game-side phase module
// (type-only import: no runtime coupling, store stays logic-free).
import type { GameMode } from "../game/ecs/game-state";
// INTERIM SkillType source — reconcile to "../game/config/skills" once gameplay
// lands the canonical config (store/skills.ts re-exports it after reconcile).
import type { SkillType } from "./skills";

// Re-export so UI consumers can import the mode type alongside the hooks.
export type { GameMode };

/**
 * Per-skill dynamic state mirrored from the ECS (SPEC §6.4). Static identity
 * (icon/name/aim/unlockWave) comes from the skills config; this is the live
 * cooldown/lock state gameplay's UISyncSystem pushes.
 */
export interface SkillSnapshot {
  /** Which skill this row is. */
  type: SkillType;
  /** Off cooldown AND unlocked → tappable. */
  ready: boolean;
  /** Seconds of cooldown left (0 when ready). */
  cooldownRemaining: number;
  /** Fraction of cooldown still remaining, 0..1 (0 when ready) — radial fill. */
  cooldownFraction: number;
  /** Unlocked at the current wave (SPEC §6.4 unlock waves). */
  unlocked: boolean;
}

/**
 * Game → React snapshot contract (SPEC §4.1, architecture rule #2).
 *
 * This is a SNAPSHOT-ONLY mirror of authoritative ECS state — never game logic.
 * Game state lives in the ECS world (locked decision); React reads a throttled
 * (<=10Hz) snapshot from here. gameplay's UISyncSystem (slot 10) calls
 * {@link setSnapshot} imperatively from the loop; HUD components read it
 * reactively via the selector hooks below so each field only re-renders its own
 * slice.
 *
 * Both sides MUST agree on this exact shape. If the field set changes, change it
 * here and in the UISyncSystem writer together.
 */
export interface GameSnapshot {
  /** Run currency (SPEC §6.5). */
  gold: number;
  /** Bastion HP — reaching 0 ends the run. */
  lives: number;
  /** Current wave number (1-based). */
  wave: number;
  /** Enemies currently alive on the battlefield. */
  enemiesAlive: number;
  /**
   * Run phase: 'menu' before a run starts (boot state), 'playing' during a run,
   * 'lost' when the bastion falls (lives <= 0), 'won' when every wave is
   * cleared. gameplay's UISyncSystem pushes the run/terminal states.
   */
  gameStatus: "menu" | "playing" | "won" | "lost";
  /**
   * Run mode (SPEC §6.3): 'campaign' (20 authored waves → 'won') or 'endless'
   * (procedural waves past the authored set, no win — ends only on lose). Drives
   * the menu mode toggle and the end-screen copy ("BLOOM PREVAILS" vs an
   * endless score-summary). gameplay's UISyncSystem mirrors the authoritative
   * mode set on startGame; PRESERVED across restart.
   */
  mode: GameMode;
  /**
   * Run score = highest wave cleared (SPEC §6.3 "wave reached"). In endless this
   * is the headline result; in campaign it simply mirrors progress (cleared
   * waves, 0 before the first clear). gameplay's UISyncSystem pushes it.
   */
  score: number;
  /**
   * Skill cooldown/lock state (SPEC §6.4), one row per skill. Static skill
   * identity lives in the skills config; this carries only the live state.
   * Empty until gameplay's UISyncSystem first pushes it (the bar falls back to
   * locked/not-ready defaults from the config meanwhile).
   */
  skills: readonly SkillSnapshot[];
  /**
   * Active mini-boss (e.g. Candy King), or null when none is on the field.
   * `hpFraction` is 1 = full → 0 = dead. gameplay's UISyncSystem sets it
   * non-null while a boss enemy is alive and clears it to null otherwise.
   */
  boss: BossSnapshot | null;
  /**
   * The tower the player has selected (tapped), or null when none. Drives the
   * upgrade/sell panel (SPEC §6.1 levels + §6.7 economy). gameplay's UISyncSystem
   * sets it from the live tower's type + level; cleared when nothing is selected
   * or the selected tower was sold.
   */
  selectedTower: SelectedTowerSnapshot | null;
}

/** Live mini-boss state for the boss health bar (SPEC §6.2 bosses). */
export interface BossSnapshot {
  /** Display name (e.g. "Candy King"). */
  name: string;
  /** Remaining HP as a fraction, 0..1 (1 = full). */
  hpFraction: number;
}

/** Live selected-tower state for the upgrade/sell panel (SPEC §6.1 / §6.7). */
export interface SelectedTowerSnapshot {
  /** ECS entity id of the selected tower. */
  eid: number;
  /** Display name (e.g. "Blossom"). */
  name: string;
  /** Current upgrade level. */
  level: 1 | 2 | 3;
  /**
   * The NEXT upgrade (label + gold cost), or null at L3 (max). The panel ALWAYS
   * shows this until L3 and greys out the button when `gold < cost` (compare
   * against the snapshot's `gold` — keeps the panel a pure mirror).
   */
  upgrade: { label: string; cost: number } | null;
  /** Gold returned on sell (SPEC §6.7: 60% if never upgraded, else 40%). */
  sellValue: number;
}

/**
 * Defaults = boot state: the game opens on the MENU (gameStatus 'menu') with
 * SPEC §6.5 Normal ("Bloom") economy preview (150 gold / 20 lives, wave 1).
 * gameplay flips to 'playing' (seeding the chosen difficulty) on start.
 */
export const DEFAULT_SNAPSHOT: GameSnapshot = {
  gold: 150,
  lives: 20,
  wave: 1,
  enemiesAlive: 0,
  gameStatus: "menu",
  mode: "campaign",
  score: 0,
  skills: [],
  boss: null,
  selectedTower: null,
};

/** Internal Zustand store. Holds ONLY a GameSnapshot — no actions, no logic. */
const useSnapshotStore = create<GameSnapshot>()(() => ({ ...DEFAULT_SNAPSHOT }));

/**
 * Imperative setter for the game loop. NOT a hook — call from gameplay's
 * UISyncSystem at <=10Hz. Replaces the whole snapshot (full object in, so the
 * throttling/diffing is the caller's concern, per the contract).
 */
export const setSnapshot = (snapshot: GameSnapshot): void => {
  useSnapshotStore.setState(snapshot, true);
};

/** Non-reactive read (tests, the loop). For components use {@link useGameSnapshot}. */
export const getSnapshot = (): GameSnapshot => useSnapshotStore.getState();

/**
 * Selector-based React hook. Components subscribe to a slice and re-render only
 * when that slice changes.
 *
 * @example const gold = useGameSnapshot((s) => s.gold);
 */
export function useGameSnapshot<T>(selector: (s: GameSnapshot) => T): T {
  return useSnapshotStore(selector);
}

/** Convenience slice selectors — each re-renders only on its own field. */
export const useGold = (): number => useSnapshotStore((s) => s.gold);
export const useLives = (): number => useSnapshotStore((s) => s.lives);
export const useWave = (): number => useSnapshotStore((s) => s.wave);
export const useEnemiesAlive = (): number => useSnapshotStore((s) => s.enemiesAlive);
export const useGameStatus = (): GameSnapshot["gameStatus"] =>
  useSnapshotStore((s) => s.gameStatus);
export const useGameMode = (): GameMode => useSnapshotStore((s) => s.mode);
export const useScore = (): number => useSnapshotStore((s) => s.score);
export const useSkills = (): readonly SkillSnapshot[] => useSnapshotStore((s) => s.skills);
export const useBoss = (): BossSnapshot | null => useSnapshotStore((s) => s.boss);
export const useSelectedTower = (): SelectedTowerSnapshot | null =>
  useSnapshotStore((s) => s.selectedTower);
