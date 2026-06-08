/**
 * Flow-field pathfinding (SPEC §4.3) — Dijkstra cost-spread from the goal cell,
 * NOT per-entity A*. Computed once on map load and again whenever a tower is
 * placed (both cold paths). Every enemy then reads the SAME field each frame at
 * zero per-entity cost: `i = flowIndexAt(x, y); dx = flowField[i*2]; dy = flowField[i*2+1]`.
 *
 * Cost grid encoding (`Uint16Array`, one entry per cell, row-major `y*width+x`):
 *   - `1`     → path tile (cheap to traverse)
 *   - `999`   → grass (traversable but heavily penalised)
 *   - `65535` → blocked / impassable (wall, tower footprint, off-map) — never entered
 * Gameplay (`src/game/`) owns the map and must encode its cost grid this way.
 *
 * The output `flowField` stores a NORMALISED downhill vector `(dx, dy)` per cell
 * pointing toward the goal. The goal cell, blocked cells, and unreachable cells
 * are all `(0, 0)`.
 */

/** Cost-grid sentinel: impassable cell (wall / tower / off-map). */
export const COST_BLOCKED = 65535;
/** Cost-grid value for a path tile. */
export const COST_PATH = 1;
/** Cost-grid value for grass (traversable, heavily penalised). */
export const COST_GRASS = 999;

const SQRT2 = Math.SQRT2;

// 8-neighbour offsets: dx, dy, step-distance multiplier (diagonal = √2).
// Module-const so the hot read path and the build loop never allocate.
const NEI_DX = [-1, 1, 0, 0, -1, 1, -1, 1];
const NEI_DY = [0, 0, -1, 1, -1, -1, 1, 1];
const NEI_DIST = [1, 1, 1, 1, SQRT2, SQRT2, SQRT2, SQRT2];

// --- Module-owned buffers (reallocated ONLY when dimensions change) ---------
let _width = 0;
let _height = 0;
let _cell = 1;

/** Normalised `(dx, dy)` per cell — `flowField[i*2]`, `flowField[i*2+1]`. Read-only. */
export let flowField = new Float32Array(0);

// Dijkstra scratch, reused across builds when dims are unchanged.
let _dist = new Float64Array(0);
let _heapEid = new Int32Array(0); // lazy-deletion binary min-heap
let _heapKey = new Float64Array(0);
let _heapSize = 0;

/** Grid width in cells. */
export function gridWidth(): number {
  return _width;
}
/** Grid height in cells. */
export function gridHeight(): number {
  return _height;
}
/** World pixels per cell. */
export function cellSize(): number {
  return _cell;
}

/**
 * Cell index for a world-space point: `cellY*width + cellX`. Zero-alloc.
 * Returns `-1` for out-of-bounds points — consumers MUST treat `< 0` as
 * "no flow" `(0, 0)` rather than indexing `flowField`.
 */
export function flowIndexAt(worldX: number, worldY: number): number {
  // Math.floor (not `| 0`): truncation would map e.g. -0.1 → 0 and hide OOB.
  const cx = Math.floor(worldX / _cell);
  const cy = Math.floor(worldY / _cell);
  if (cx < 0 || cy < 0 || cx >= _width || cy >= _height) return -1;
  return cy * _width + cx;
}

function ensureCapacity(width: number, height: number): void {
  if (width === _width && height === _height && flowField.length !== 0) return;
  const n = width * height;
  flowField = new Float32Array(n * 2);
  _dist = new Float64Array(n);
  // Lazy-deletion Dijkstra can push a node once per relaxation; bounded by edges (8n).
  const cap = n * 8 + 1;
  _heapEid = new Int32Array(cap);
  _heapKey = new Float64Array(cap);
}

function heapPush(eid: number, key: number): void {
  let i = _heapSize++;
  _heapEid[i] = eid;
  _heapKey[i] = key;
  while (i > 0) {
    const parent = (i - 1) >> 1;
    if (_heapKey[parent] <= _heapKey[i]) break;
    const te = _heapEid[parent];
    const tk = _heapKey[parent];
    _heapEid[parent] = _heapEid[i];
    _heapKey[parent] = _heapKey[i];
    _heapEid[i] = te;
    _heapKey[i] = tk;
    i = parent;
  }
}

/** Pop the min-key entry's eid; key is read separately via `_heapKey` pre-pop. */
function heapPop(): number {
  const top = _heapEid[0];
  const last = --_heapSize;
  _heapEid[0] = _heapEid[last];
  _heapKey[0] = _heapKey[last];
  let i = 0;
  for (;;) {
    const l = i * 2 + 1;
    const r = l + 1;
    let smallest = i;
    if (l < _heapSize && _heapKey[l] < _heapKey[smallest]) smallest = l;
    if (r < _heapSize && _heapKey[r] < _heapKey[smallest]) smallest = r;
    if (smallest === i) break;
    const te = _heapEid[smallest];
    const tk = _heapKey[smallest];
    _heapEid[smallest] = _heapEid[i];
    _heapKey[smallest] = _heapKey[i];
    _heapEid[i] = te;
    _heapKey[i] = tk;
    i = smallest;
  }
  return top;
}

/**
 * Recompute the flow field via Dijkstra cost-spread from `(goalCellX, goalCellY)`.
 * Cold path (map load + tower placement). Buffers persist across calls and only
 * reallocate when `width`/`height` change.
 */
export function buildFlowField(
  cost: Uint16Array,
  width: number,
  height: number,
  cellSize: number,
  goalCellX: number,
  goalCellY: number,
): void {
  ensureCapacity(width, height);
  _width = width;
  _height = height;
  _cell = cellSize;
  const n = width * height;

  for (let i = 0; i < n; i++) _dist[i] = Number.POSITIVE_INFINITY;
  _heapSize = 0;

  const goal = goalCellY * width + goalCellX;
  if (goalCellX >= 0 && goalCellY >= 0 && goalCellX < width && goalCellY < height) {
    _dist[goal] = 0;
    heapPush(goal, 0);
  }

  // Dijkstra with lazy deletion: a popped node is stale if a better dist was
  // recorded since it was pushed (its heap key exceeds the settled distance).
  while (_heapSize > 0) {
    const key = _heapKey[0];
    const cur = heapPop();
    if (key > _dist[cur]) continue;
    const cx = cur % width;
    const cy = (cur / width) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = cx + NEI_DX[k];
      const ny = cy + NEI_DY[k];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = ny * width + nx;
      const c = cost[ni];
      if (c >= COST_BLOCKED) continue; // wall — never traversed
      const nd = _dist[cur] + c * NEI_DIST[k];
      if (nd < _dist[ni]) {
        _dist[ni] = nd;
        heapPush(ni, nd);
      }
    }
  }

  // Derive each cell's downhill vector toward its lowest-distance neighbour.
  for (let i = 0; i < n; i++) {
    flowField[i * 2] = 0;
    flowField[i * 2 + 1] = 0;
    if (cost[i] >= COST_BLOCKED) continue; // blocked → (0,0)
    if (!Number.isFinite(_dist[i])) continue; // unreachable → (0,0)
    if (i === goal) continue; // goal → (0,0)
    const cx = i % width;
    const cy = (i / width) | 0;
    let best = _dist[i];
    let bdx = 0;
    let bdy = 0;
    for (let k = 0; k < 8; k++) {
      const nx = cx + NEI_DX[k];
      const ny = cy + NEI_DY[k];
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const nd = _dist[ny * width + nx];
      if (nd < best) {
        best = nd;
        bdx = NEI_DX[k];
        bdy = NEI_DY[k];
      }
    }
    if (bdx !== 0 || bdy !== 0) {
      const inv = bdx !== 0 && bdy !== 0 ? 1 / SQRT2 : 1; // diagonal → unit length
      flowField[i * 2] = bdx * inv;
      flowField[i * 2 + 1] = bdy * inv;
    }
  }
}
