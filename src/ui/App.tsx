import { Hud } from "./hud";

/**
 * React HUD overlay root (DOM only, never inside the canvas — SPEC §4.1).
 * Mounts the heads-up display over the Pixi battlefield. Game state stays in
 * the ECS world; the HUD reads a throttled (<=10Hz) snapshot via Zustand
 * (`src/store/game-snapshot.ts`), populated by gameplay's UISyncSystem.
 */
export function App() {
  return <Hud />;
}
