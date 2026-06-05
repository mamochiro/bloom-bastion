/**
 * React HUD overlay root (DOM only, never inside the canvas — SPEC §4.1).
 * M0 placeholder: a title strip proving the React layer mounts over Pixi and
 * reads design tokens. Real HUD/menus come in later milestones (ui-dev).
 */
export function App() {
  return (
    <header
      style={{
        padding: "max(env(safe-area-inset-top), var(--s3)) var(--s4) var(--s2)",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        gap: "var(--s2)",
      }}
    >
      <span style={{ textShadow: "0 0 14px var(--blossom-mid)" }}>🌸 Bloom Bastion</span>
      <span style={{ color: "var(--text-dim)", fontSize: 12, fontWeight: 600 }}>M0 · scaffold</span>
    </header>
  );
}
