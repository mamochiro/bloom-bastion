import { expect, test } from "@playwright/test";

/**
 * Happy-path E2E (SPEC §12) — boots the real app in a browser and drives the
 * core loop: menu → start a Normal run → place a tower → let a wave run. The
 * point jsdom can't give us is the WHITE-SCREEN / runtime-crash check: we fail
 * on ANY uncaught exception or console error across the whole flow.
 *
 * Coordinate note: the Pixi renderer uses `resizeTo: window` + autoDensity, so
 * world px == CSS px (scale 1). The flow-field grid is 16×9 @ 60px; the lane is
 * row 4, so cell (3,2) — screen (210,150) — is a buildable GRASS tile.
 */
test("boots clean, starts a Normal run, places + upgrades a tower, survives a live wave", async ({
  page,
}) => {
  // --- Boot-proof: any uncaught error or console.error fails the test. ---
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await page.goto("/");

  // Pixi actually mounted: a <canvas> inside #game with real dimensions.
  await expect(page.locator("#game")).toHaveCount(1);
  const canvas = page.locator("#game canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box, "canvas should have a bounding box (Pixi mounted)").not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThan(0);
  expect(box?.height ?? 0).toBeGreaterThan(0);

  // Start screen visible (boot phase = 'menu').
  const startDialog = page.getByRole("dialog", { name: /Bloom Bastion/i });
  await expect(startDialog).toBeVisible();

  // Pick Normal difficulty, then Play.
  await page.getByText("Normal", { exact: true }).click();
  await page.getByRole("button", { name: /^Play$/ }).click();

  // Run started (menu → playing): start screen gone, the playing-only Skill bar
  // appears, and the HUD shows the Normal §6.5 economy (150 gold).
  await expect(startDialog).toBeHidden();
  await expect(page.locator('[aria-label="Skills"]')).toBeVisible();
  const goldPill = page.locator('div[aria-label$="gold"]'); // the HUD pill (tower cards are <button>)
  await expect(goldPill).toBeVisible();
  await expect(goldPill).toHaveAttribute("aria-label", "150 gold");
  await expect(page.locator('[aria-label$="lives remaining"]')).toBeVisible();
  await expect(page.locator('[aria-label^="Wave "]')).toBeVisible();

  // The picker carries the full 6-tower roster (Sugar #3, Luna #4, Hive #5, Bubbler #6).
  await expect(page.getByRole("button", { name: /Sugar Cannon/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Luna Crystal/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bubbler/ })).toBeVisible();

  // Place a Blossom (cost 50) on a grass cell → gold spent 150 → 100.
  await page.getByRole("button", { name: /Blossom/ }).click();
  const cbox = await canvas.boundingBox();
  expect(cbox).not.toBeNull();
  const towerX = (cbox?.x ?? 0) + 3 * 60 + 30;
  const towerY = (cbox?.y ?? 0) + 2 * 60 + 30; // cell (3,2)
  await page.mouse.click(towerX, towerY);
  await expect(goldPill).toHaveAttribute("aria-label", "100 gold");

  // --- Upgrade loop (real-browser proof of the new feature, SPEC §6.1) ---
  // No build selection is active after placement, so re-tapping the tower's cell
  // SELECTS it → the UpgradePanel drawer opens.
  await page.mouse.click(towerX, towerY);
  await expect(page.getByRole("dialog", { name: /Blossom tower, level 1/i })).toBeVisible();
  // Apply L2 "Bigger Bloom" (+40g): gold 100 → 60, tower level → 2.
  await page.getByRole("button", { name: /^Upgrade:/ }).click();
  await expect(goldPill).toHaveAttribute("aria-label", "60 gold");
  await expect(page.getByRole("dialog", { name: /Blossom tower, level 2/i })).toBeVisible();
  await expect(page.getByText("Lv 2")).toBeVisible();

  // Let a live wave run; the sim ticks (spawn → path-follow → tower → death).
  // Surviving this window with zero errors IS the no-crash proof.
  await page.waitForTimeout(4000);
  await expect(page.locator('[aria-label^="Wave "]')).toBeVisible(); // HUD still alive

  expect(errors, `runtime errors during the run:\n${errors.join("\n")}`).toEqual([]);
});

/**
 * Hive bee-render path (Tower #5). jsdom can't exercise the NEW pooled-minion
 * render/AI: bees acquire from the pool, draw a 400-band centered sprite,
 * free-fly toward ground enemies, and release on expiry. Placing a Hive and
 * running a live wave drives all of that in a real browser; any crash in the
 * minion spawn/move/expire/render path trips the zero-error assertion.
 */
test("places a Hive and renders its bee swarm over a live wave without crashing", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
  });

  await page.goto("/");
  await page.getByText("Normal", { exact: true }).click();
  await page.getByRole("button", { name: /^Play$/ }).click();
  await expect(page.getByRole("dialog", { name: /Bloom Bastion/i })).toBeHidden();

  const goldPill = page.locator('div[aria-label$="gold"]');
  await expect(goldPill).toHaveAttribute("aria-label", "150 gold");
  const cbox = await page.locator("#game canvas").boundingBox();
  expect(cbox).not.toBeNull();

  // Select the Hive (125g) and place it on a grass cell → gold 150 → 25.
  await page.getByRole("button", { name: /Hive/ }).click();
  await page.mouse.click((cbox?.x ?? 0) + 3 * 60 + 30, (cbox?.y ?? 0) + 2 * 60 + 30); // cell (3,2)
  await expect(goldPill).toHaveAttribute("aria-label", "25 gold");

  // Let the swarm spawn → seek → attack → expire across a live wave.
  await page.waitForTimeout(5000);
  await expect(page.locator('[aria-label^="Wave "]')).toBeVisible();
  expect(errors, `runtime errors with the bee swarm live:\n${errors.join("\n")}`).toEqual([]);
});
