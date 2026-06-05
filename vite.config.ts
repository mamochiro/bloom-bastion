import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// SPEC §11.2 — Vite runs on the Bun runtime; Bun is the package manager.
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose on LAN for real-device mobile testing.
    host: true,
  },
  // Game assets that should be served/copied verbatim (SPEC §9, §3).
  assetsInclude: ["**/*.riv", "**/*.webm"],
  build: {
    target: "es2022",
    rollupOptions: {
      output: {
        // Split big vendors for better long-term caching (SPEC §11.2).
        manualChunks: {
          pixi: ["pixi.js"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/unit/**/*.test.ts"],
  },
});
