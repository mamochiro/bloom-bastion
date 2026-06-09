import { type CSSProperties, useEffect, useRef, useState } from "react";
import { type SkillSnapshot, useGameStatus, useSkills } from "../../store/game-snapshot";
import type { SkillType } from "../../store/skills";

/**
 * Per-skill flash accent (design tokens). Freeze → cool blue (storm), Gold Rush
 * → gold, Meteor → a faint warm flash (it also has its in-world impact burst).
 * UI-only presentation, like the skill-bar accents.
 */
export const FLASH_COLOR: Record<SkillType, string> = {
  meteor: "var(--sugar-mid)",
  freeze: "var(--storm-mid)",
  goldRush: "var(--gold)",
};

const FLASH_MS = 260;

/**
 * Detect a skill ACTIVATION edge from the snapshot: a skill that was READY on
 * the previous tick and is now NOT ready just fired. Pure — returns the fired
 * skill type (last one wins if several fire at once), or null. Does NOT fire for
 * a steadily-cooling skill (was already !ready) or an idle/just-unlocked one.
 */
export function detectSkillActivation(
  prevReady: Readonly<Partial<Record<SkillType, boolean>>>,
  skills: readonly SkillSnapshot[],
): SkillType | null {
  let fired: SkillType | null = null;
  for (const s of skills) {
    if (prevReady[s.type] === true && !s.ready) fired = s.type;
  }
  return fired;
}

/**
 * Skill activation screen flash (VFX). Watches `useSkills()` and, on a
 * ready→fired edge (derived — NO new gameplay contract), shows a brief
 * (~260ms) full-screen tint in the skill's accent, then self-dismisses. Only
 * during `gameStatus === 'playing'`.
 *
 * Placement/pointer-events: a full-screen overlay that paints above the canvas
 * but BELOW the interactive HUD (rendered first in the Hud tree) and is always
 * `pointer-events:none` + `aria-hidden` — decorative, never blocks taps or gets
 * announced. The accent is passed as the `--flash` CSS custom property; the
 * gradient + fade animation live in `globals.css` (`.skill-flash`).
 */
export function SkillFlash() {
  const status = useGameStatus();
  const skills = useSkills();
  const prevReady = useRef<Partial<Record<SkillType, boolean>>>({});
  const flashId = useRef(0);
  const [flash, setFlash] = useState<{ color: string; id: number } | null>(null);

  // Detect the activation edge against the previous snapshot.
  useEffect(() => {
    if (status !== "playing") {
      // Reset so re-entering play doesn't fire on an already-ready skill.
      prevReady.current = {};
      return;
    }
    const fired = detectSkillActivation(prevReady.current, skills);
    const next: Partial<Record<SkillType, boolean>> = {};
    for (const s of skills) next[s.type] = s.ready;
    prevReady.current = next;
    if (fired) {
      flashId.current += 1;
      setFlash({ color: FLASH_COLOR[fired], id: flashId.current });
    }
  }, [skills, status]);

  // Auto-dismiss — no lingering overlay.
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), FLASH_MS);
    return () => clearTimeout(t);
  }, [flash]);

  if (status !== "playing" || !flash) return null;

  const overlay: CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
  };
  // `--flash` carries the token accent; the gradient/animation are in CSS.
  return (
    <div
      key={flash.id}
      className="skill-flash"
      aria-hidden="true"
      style={{ ...overlay, "--flash": flash.color } as CSSProperties}
    />
  );
}
