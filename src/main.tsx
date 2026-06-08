import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { startLoop } from "./engine/loop";
import { bootRenderer } from "./engine/renderer/pixi-app";
import { buildLevel } from "./game/map/level-1";
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

  // Build the board's cost grid + flow field so it renders behind the start
  // screen. The game boots into the 'menu' phase — the sim is FROZEN (no spawn /
  // movement) and there is NO auto-placed tower. The player picks a difficulty
  // and taps Play; InputSystem (slot 1) consumes the start command → startGame
  // seeds the economy + wave and unfreezes the run.
  buildLevel();
  startLoop(GAME_SYSTEMS);

  createRoot(uiMount).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
