import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { world } from "./engine/ecs/world";
import { startLoop } from "./engine/loop";
import { COST_BLOCKED } from "./engine/pathfinding/flow-field";
import { bootRenderer } from "./engine/renderer/pixi-app";
import { TowerType } from "./game/config/towers";
import { initResources } from "./game/ecs/resources";
import { placeTower } from "./game/entities/create-tower";
import { buildLevel, cellIndex, costGrid } from "./game/map/level-1";
import { GAME_SYSTEMS } from "./game/pipeline";
import { App } from "./ui/App";
import "./ui/styles/globals.css";

/**
 * Entry point. Boots the Pixi renderer (canvas layer) first, starts the ECS
 * RAF loop (SPEC §4.2/§4.6), then mounts the React HUD overlay on top. Game
 * state lives in the ECS world (SPEC §4), never in React — this is overlay-only.
 */
async function start(): Promise<void> {
  const gameMount = document.getElementById("game");
  const uiMount = document.getElementById("root");
  if (!gameMount || !uiMount) {
    throw new Error("Missing #game or #root mount node in index.html");
  }

  await bootRenderer(gameMount);

  // M1 slice: build the level cost grid + flow field, then drop one Blossom
  // tower on a GRASS cell beside the lane (cell 5,3 — row 4 is the path, kept
  // clear). Block that footprint and rebuild the field so the recompute-on-
  // placement path (SPEC §4.3) is exercised on boot.
  buildLevel();
  const TOWER_CELL = { x: 5, y: 3 } as const;
  costGrid[cellIndex(TOWER_CELL.x, TOWER_CELL.y)] = COST_BLOCKED;
  buildLevel();
  placeTower(world, TowerType.Blossom, TOWER_CELL.x, TOWER_CELL.y);

  // Seed the run economy (SPEC §6.5 Normal: 150 gold / 20 lives). Authoritative
  // in ECS — DeathSystem credits kill rewards here; UISync mirrors it later.
  initResources(world);

  // SpawnSystem (inside GAME_SYSTEMS) seeds its wave at t=0; the loop ticks the
  // full §4.2 pipeline (Spawn → PathFollow → … → Render).
  startLoop(GAME_SYSTEMS);

  createRoot(uiMount).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
