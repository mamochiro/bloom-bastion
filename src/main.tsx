import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { bootRenderer } from "./engine/renderer/pixi-app";
import { App } from "./ui/App";
import "./ui/styles/globals.css";

/**
 * Entry point. Boots the Pixi renderer (canvas layer) first, then mounts the
 * React HUD overlay on top. Game state will live in the ECS world (SPEC §4),
 * never in React — this is overlay-only.
 */
async function start(): Promise<void> {
  const gameMount = document.getElementById("game");
  const uiMount = document.getElementById("root");
  if (!gameMount || !uiMount) {
    throw new Error("Missing #game or #root mount node in index.html");
  }

  await bootRenderer(gameMount);

  createRoot(uiMount).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();
