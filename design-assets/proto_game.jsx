/* global React, ReactDOM, TOWERS, ENEMIES, TILES */
// ============================================================
// BLOOM BASTION — Playable one-wave prototype
// Real interactions: place towers, start the wave, watch towers
// auto-fire at enemies walking the path. Full juice.
// ============================================================
const { useRef, useReducer, useState, useEffect, memo } = React;

// ---------- FIELD GEOMETRY ----------
const FIELD_W = 780, FIELD_H = 500, CELL = 60;
const COLS = FIELD_W / CELL, ROWS = FIELD_H / CELL; // 13 x 8 (approx)

// ---------- MAPS / BIOMES ----------
// Each map: a winding path (enters left, exits right) + a biome palette + props.
const MAPS = {
  meadow: {
    name: 'Meadow', tag: 'Verdant fields', biome: '🌼',
    waypoints: [{ x: -40, y: 90 }, { x: 270, y: 90 }, { x: 270, y: 270 }, { x: 540, y: 270 }, { x: 540, y: 150 }, { x: 820, y: 150 }],
    c: { grassTop: '#58ba4e', grassBot: '#45a03e', patchA: '#63c457', patchB: '#3d9036', pathRim: '#7a5f3a', pathTop: '#d8bd8b', pathBot: '#b89863', pathCenter: '#dcc596', dash: '#a6864f', tuft: '#3f8a38', portalIn: '#0c0618', portalMid: '#3a1d6b', portalOut: '#8c4dff', swirl: 'var(--shade-glow)', keepBody: 'var(--bg-elevated)', keepTrim: 'var(--gold)' },
    props: [['flower', 120, 196, 38], ['tree', 158, 374, 52], ['mushroom', 432, 116, 34], ['flower', 360, 332, 34], ['mushroom', 706, 360, 32], ['tree', 612, 96, 48], ['flower', 690, 196, 30], ['mushroom', 92, 300, 30]],
  },
  frost: {
    name: 'Frostpeak', tag: 'Icy switchbacks', biome: '❄️',
    waypoints: [{ x: -40, y: 150 }, { x: 180, y: 150 }, { x: 180, y: 360 }, { x: 420, y: 360 }, { x: 420, y: 120 }, { x: 640, y: 120 }, { x: 640, y: 300 }, { x: 860, y: 300 }],
    c: { grassTop: '#cfe9f5', grassBot: '#a9cfe0', patchA: '#e6f4fb', patchB: '#93bcd0', pathRim: '#6f93a6', pathTop: '#e4f1f8', pathBot: '#b6d4e4', pathCenter: '#f1f9fc', dash: '#8fb3c6', tuft: '#7fa6b8', portalIn: '#08121c', portalMid: '#1f5a8e', portalOut: '#5db8ff', swirl: '#d2ecff', keepBody: '#34506a', keepTrim: '#9fd6ff' },
    props: [['tree', 150, 70, 46], ['tree', 690, 430, 44], ['mushroom', 520, 70, 30], ['flower', 100, 450, 28], ['tree', 300, 200, 40]],
    hazard: { type: 'slow', x: 420, y: 240, r: 74, label: 'ICE FIELD', icon: '❄️' },
  },
  ember: {
    name: 'Emberfall', tag: 'Volcanic ridges', biome: '🔥',
    waypoints: [{ x: -40, y: 400 }, { x: 150, y: 400 }, { x: 150, y: 120 }, { x: 390, y: 120 }, { x: 390, y: 380 }, { x: 620, y: 380 }, { x: 620, y: 180 }, { x: 860, y: 180 }],
    c: { grassTop: '#5a3f3a', grassBot: '#3e2a28', patchA: '#6e4a40', patchB: '#2e201e', pathRim: '#3a2420', pathTop: '#8a5a3a', pathBot: '#6b4030', pathCenter: '#c2773f', dash: '#e0843a', tuft: '#e07b1f', portalIn: '#1a0805', portalMid: '#7a1f10', portalOut: '#ff7a3d', swirl: '#ffd34d', keepBody: '#4a2a22', keepTrim: '#ff7a3d' },
    props: [['mushroom', 250, 250, 30], ['mushroom', 720, 90, 28]],
    hazard: { type: 'burn', x: 390, y: 250, r: 68, dps: 0.06, label: 'LAVA VENT', icon: '🔥' },
  },
  candy: {
    name: 'Sugarrush', tag: 'Candy switchbacks', biome: '🍭',
    waypoints: [{ x: -40, y: 250 }, { x: 120, y: 250 }, { x: 120, y: 90 }, { x: 340, y: 90 }, { x: 340, y: 410 }, { x: 560, y: 410 }, { x: 560, y: 160 }, { x: 860, y: 160 }],
    c: { grassTop: '#ffd9ec', grassBot: '#f4b3d2', patchA: '#ffe8f4', patchB: '#e89cc4', pathRim: '#7a4a2e', pathTop: '#e3a875', pathBot: '#b56b3e', pathCenter: '#f3cf9e', dash: '#fff0c0', tuft: '#ff9ec9', portalIn: '#2a0d1c', portalMid: '#c43d77', portalOut: '#ff6fa5', swirl: '#ffd6e8', keepBody: '#7a4fd6', keepTrim: '#ffd700' },
    props: [['mushroom', 220, 320, 32], ['flower', 470, 180, 30], ['mushroom', 690, 320, 28], ['flower', 220, 160, 26]],
    hazard: { type: 'slow', x: 340, y: 250, r: 72, label: 'STICKY TOFFEE', icon: '🍬' },
  },
};

let ACTIVE = null;
function setMap(id) {
  const m = MAPS[id] || MAPS.meadow;
  const wp = m.waypoints, segs = []; let len = 0;
  for (let i = 0; i < wp.length - 1; i++) { const a = wp[i], b = wp[i + 1]; const l = Math.hypot(b.x - a.x, b.y - a.y); segs.push({ a, b, len: l, start: len }); len += l; }
  const last = wp[wp.length - 1];
  ACTIVE = { id, map: m, waypoints: wp, segs, pathLen: len, exit: { x: Math.min(FIELD_W - 24, last.x), y: last.y } };
}
setMap('meadow');

function pointAt(dist) {
  const segs = ACTIVE.segs;
  for (const s of segs) {
    if (dist <= s.start + s.len || s === segs[segs.length - 1]) {
      const t = (dist - s.start) / s.len;
      return { x: s.a.x + (s.b.x - s.a.x) * t, y: s.a.y + (s.b.y - s.a.y) * t };
    }
  }
  return ACTIVE.waypoints[ACTIVE.waypoints.length - 1];
}
// distance from a point to the path polyline (for buildability)
function distToPath(px, py) {
  let best = Infinity;
  for (const s of ACTIVE.segs) {
    const dx = s.b.x - s.a.x, dy = s.b.y - s.a.y;
    const L2 = dx * dx + dy * dy;
    let t = L2 ? ((px - s.a.x) * dx + (py - s.a.y) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = s.a.x + dx * t, cy = s.a.y + dy * t;
    best = Math.min(best, Math.hypot(px - cx, py - cy));
  }
  return best;
}

// ---------- TOWER STATS ----------
const TSTATS = {
  blossom: { dmg: 16, range: 116, cd: 520, pspeed: 520, color: 'var(--blossom-mid)', proj: 'petal' },
  storm:   { dmg: 22, range: 124, cd: 900, pspeed: 900, color: 'var(--gold)', proj: 'bolt' },
  sugar:   { dmg: 34, range: 96,  cd: 1150, pspeed: 360, color: 'var(--sugar-mid)', proj: 'candy', splash: 46 },
  luna:    { dmg: 26, range: 158, cd: 1000, pspeed: 760, color: 'var(--luna-light)', proj: 'beam' },
  hive:    { dmg: 7,  range: 104, cd: 300, pspeed: 480, color: 'var(--hive-mid)', proj: 'bee' },
  bubble:  { dmg: 5,  range: 108, cd: 850, pspeed: 420, color: 'var(--bubble-mid)', proj: 'bubble', slow: 0.45 },
};

// ---------- ENEMY STATS ----------
const ESTATS = {
  grub:  { hp: 34, speed: 46, gold: 6, scale: 0.62 },
  snail: { hp: 78, speed: 30, gold: 10, scale: 0.74 },
  plushy:{ hp: 150, speed: 34, gold: 18, scale: 0.8 },
  flutter:{ hp: 26, speed: 70, gold: 8, scale: 0.6, fly: true },
  shade: { hp: 64, speed: 42, gold: 14, scale: 0.7, phase: true },
  splitter:{ hp: 96, speed: 36, gold: 16, scale: 0.78, split: true },
  king:  { hp: 680, speed: 24, gold: 220, scale: 1.12, boss: true },
  dragon:{ hp: 1200, speed: 28, gold: 420, scale: 1.24, boss: true },
};

// ---------- DIFFICULTY ----------
const DIFF = {
  sprout:  { waves: 10, boss: 'king', mult: 0.82 },
  bloom:   { waves: 20, boss: 'king', mult: 1.0 },
  bastion: { waves: 30, boss: 'dragon', mult: 1.22 },
  endless: { waves: Infinity, boss: 'king', mult: 1.05 },
};

// wave composition (type, count, gap ms) — scales with wave n
function buildWave(n, total, diff) {
  const q = [];
  let t = 600;
  const add = (type, count, gap) => { for (let i = 0; i < count; i++) { q.push({ type, at: t }); t += gap; } };
  add('grub', 4 + Math.floor(n * 0.8), Math.max(280, 720 - n * 22));
  if (n >= 2) add('snail', 2 + Math.floor(n * 0.45), 760);
  if (n >= 2) add('flutter', 2 + Math.floor(n * 0.4), 620);
  if (n >= 3) add('splitter', 1 + Math.floor(n * 0.28), 900);
  if (n >= 4) add('shade', 1 + Math.floor(n * 0.28), 820);
  if (n >= 4) add('plushy', 1 + Math.floor(n * 0.22), 1150);
  const cfg = DIFF[diff] || DIFF.bloom;
  const isFinal = total !== Infinity && n >= total;
  if (isFinal) { t += 500; q.push({ type: cfg.boss, at: t, boss: true }); }
  else if (total !== Infinity && diff === 'bastion' && n === Math.floor(total / 2)) { t += 500; q.push({ type: 'king', at: t, boss: true }); }
  else if (total === Infinity && n % 5 === 0) { t += 500; q.push({ type: 'king', at: t, boss: true }); }
  return q;
}

// build a fresh run state for a given difficulty
// ---- endless leaderboard ----
let LAST_LB = 0; // timestamp of the most-recently-added entry (for highlight)
function lbGet() { try { return JSON.parse(localStorage.getItem('bb_lb') || '[]'); } catch (e) { return []; } }
function lbAdd(score, wave, map, mut) {
  try {
    const l = lbGet(); const t = Date.now();
    const mults = mut ? Object.keys(mut).filter(k => mut[k]).length : 0;
    l.push({ score, wave, map: map || 'meadow', mults, d: new Date().toISOString().slice(0, 10), t });
    l.sort((a, b) => b.score - a.score);
    localStorage.setItem('bb_lb', JSON.stringify(l.slice(0, 8)));
    LAST_LB = t;
  } catch (e) {}
}
function freshState(diffKey) {
  const cfg = DIFF[diffKey] || DIFF.bloom;
  const ps = (window.BBShop && window.BBShop.perkStats) ? window.BBShop.perkStats() : { gold: 0, lives: 0, interest: 0, refund: 0 };
  return { gold: 280 + ps.gold, lives: 20 + ps.lives, startLives: 20 + ps.lives, score: 0, combo: 0, lastKill: 0, wave: 1, total: cfg.waves, diff: diffKey || 'bloom',
    interestBonus: ps.interest || 0, refundBonus: ps.refund || 0, abil: { nova: 0, freeze: 0 }, mut: null, scoreMult: 1,
    towers: [], enemies: [], projs: [], parts: [], floats: [], fx: [], queue: [], spawnIdx: 0, t0: 0, running: false, lastBonus: 0, lastInterest: 0 };
}
// spawn an expanding-ring visual effect (placement / upgrade)
function pushFx(s, x, y, color, kind) { (s.fx || (s.fx = [])).push({ id: nid(), x, y, color, kind, born: CLOCK }); }

// ---------- MEMOIZED SPRITES ----------
const EnemyGlyph = memo(function EnemyGlyph({ type }) {
  const C = ENEMIES[type].comp; return <C />;
});
const TowerGlyph = memo(function TowerGlyph({ type, level }) {
  const C = TOWERS[type].comp; return <C level={level} />;
});

let UID = 1;
const nid = () => UID++;
let CLOCK = 0; // shared sim clock (ms), advanced by rAF or __step
let SHAKE_ENABLED = true, REDUCED_MOTION = false; // mirrored from live settings
// safe audio call — no-op if the engine failed to load
function BA(fn) { try { const A = window.BBAudio; if (A && A[fn]) A[fn].apply(A, Array.prototype.slice.call(arguments, 1)); } catch (e) {} }
// equipped-skin CSS vars for a tower family (no-op if shop absent)
function skinVars(family) { try { return (window.BBShop && window.BBShop.skinVars) ? window.BBShop.skinVars(family) : {}; } catch (e) { return {}; } }
function GEM(n) { try { if (window.BBShop) window.BBShop.addGems(n); } catch (e) {} }
function ACH(t, d) { try { if (window.BBAch) window.BBAch.note(t, d); } catch (e) {} }
function DAILY(s) { try { if (s.daily && window.BBDaily) window.BBDaily.setBest(s.score); } catch (e) {} }

// ============================================================
// GAME COMPONENT
// ============================================================
function Game() {
  const [, render] = useReducer(x => x + 1, 0);
  const g = useRef(null);
  const [sel, setSel] = useState('blossom');     // selected tower type to place
  const [hoverCell, setHoverCell] = useState(null);
  const [status, setStatus] = useState('ready');  // ready | running | cleared | won | lost
  const [shake, setShake] = useState(0);
  const [hurtFx, setHurtFx] = useState(null);   // {key, amount} — pulses on life loss
  const [banner, setBanner] = useState(null);   // wave-start banner
  const [pending, setPending] = useState(null);  // {type, cx, cy} — placement awaiting confirm
  const bannerTo = useRef();
  const [selTower, setSelTower] = useState(null);  // id of a selected placed tower
  const fieldRef = useRef(null);
  // --- flow / menus / settings ---
  const [screen, setScreen] = useState('menu');    // menu | difficulty | loadout | game
  const [difficulty, setDifficulty] = useState(null);
  const [menuInfo, setMenuInfo] = useState(null);
  const [showShop, setShowShop] = useState(false);
  const [showAch, setShowAch] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [coach, setCoach] = useState(null);
  const [mapSel, setMapSel] = useState('meadow');
  const [mutators, setMutators] = useState({ double: false, glass: false, fog: false });
  const [paused, setPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loadout, setLoadout] = useState(null);   // chosen tower keys
  const [settings, setSettings] = useState(loadSettings);
  const settingsRef = useRef(settings);
  const wasRunning = useRef(false);
  const speedRef = useRef(1);
  const [speed, setSpeed] = useState(1);
  const toggleSpeed = () => setSpeed(v => { const n = v === 1 ? 2 : 1; speedRef.current = n; BA('ui'); return n; });
  const best = useRef(+(localStorage.getItem('bb_best') || 0));
  const recordBest = (w) => { if (w > best.current) { best.current = w; try { localStorage.setItem('bb_best', String(w)); } catch (e) {} } };
  useEffect(() => { settingsRef.current = settings; saveSettings(settings); SHAKE_ENABLED = settings.shake; REDUCED_MOTION = settings.reduced; BA('setMusic', settings.music); BA('setSfx', settings.sfx); BA('setMusicOn', settings.musicOn); BA('setSfxOn', settings.sfxOn); }, [settings]);
  const changeSettings = (partial) => setSettings(s => ({ ...s, ...partial }));

  if (!g.current) { g.current = freshState('bloom'); }
  window.__gref = g; // debug handle

  // ---- simulation step (clock-driven, decoupled from rAF) ----
  const stepRef = useRef();
  stepRef.current = (dt) => {
    CLOCK += dt * 1000;
    const now = CLOCK;
    const s = g.current;
    if (!s.running) return;
    if (s.abil) { s.abil.nova = Math.max(0, s.abil.nova - dt * 1000); s.abil.freeze = Math.max(0, s.abil.freeze - dt * 1000); }
    const elapsed = now - s.t0;
    // spawn
    while (s.spawnIdx < s.queue.length && elapsed >= s.queue[s.spawnIdx].at) {
      const spec = s.queue[s.spawnIdx++];
      const st = ESTATS[spec.type];
      const dmult = (DIFF[s.diff] || DIFF.bloom).mult || 1;
      const hpScale = (1 + (s.wave - 1) * 0.075) * dmult;
      const hp = Math.round(st.hp * hpScale);
      const p0 = pointAt(0);
      s.enemies.push({ id: nid(), type: spec.type, dist: 0, x: p0.x, y: p0.y, hp, maxhp: hp, speed: st.speed * (s.mut && s.mut.double ? 1.5 : 1), slowUntil: 0, hitUntil: 0, boss: !!spec.boss, phaseOff: Math.random() * 2600 });
      if (spec.boss) BA('boss');
    }
    // move enemies (with biome hazard: ice slows · lava burns)
    const HAZ = ACTIVE.map.hazard;
    for (const e of s.enemies) {
      if (ESTATS[e.type].phase) e.phased = (((now + (e.phaseOff || 0)) % 2600) < 900);
      let hazSlow = 1;
      if (HAZ && e.x != null && Math.hypot(e.x - HAZ.x, e.y - HAZ.y) < HAZ.r) {
        if (HAZ.type === 'slow') hazSlow = 0.5;
        else if (HAZ.type === 'burn' && !e.boss) {
          e.hp -= e.maxhp * HAZ.dps * dt; e.hitUntil = now + 80;
          if (!REDUCED_MOTION && Math.random() < 0.18) s.parts.push({ id: nid(), x: e.x, y: e.y - 10, vx: (Math.random() - .5) * 30, vy: -50 - Math.random() * 40, life: .4, max: .4, sz: 3 + Math.random() * 3, color: Math.random() < .5 ? 'var(--sugar-mid)' : 'var(--gold)' });
        }
      }
      const slowF = (now < e.slowUntil ? 0.5 : 1) * hazSlow;
      e.dist += e.speed * slowF * dt;
      const p = pointAt(e.dist); e.x = p.x; e.y = p.y;
      if (e.dist >= ACTIVE.pathLen) { e.reached = true; }
    }
    // enemies that reached the end -> lose life
    const reached = s.enemies.filter(e => e.reached);
    if (reached.length) {
      s.lives -= reached.length; s.combo = 0;
      s.enemies = s.enemies.filter(e => !e.reached);
      triggerShake(setShake, 13);
      s.hurtUntil = now + 520;
      if (!REDUCED_MOTION) { for (let i = 0; i < 11; i++) { const a = Math.random() * Math.PI * 2, sp = 80 + Math.random() * 130; s.parts.push({ id: nid(), x: ACTIVE.exit.x, y: ACTIVE.exit.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 36, life: .5, max: .5, sz: 5 + Math.random() * 4, color: i % 2 ? 'var(--danger)' : '#ff8da3' }); } }
      s.floats.push({ id: nid(), x: ACTIVE.exit.x - 8, y: ACTIVE.exit.y - 38, text: '−' + reached.length + ' ❤', color: 'var(--danger)', born: now, big: true });
      setHurtFx({ key: nid(), amount: reached.length });
      BA('life');
    }
    // towers fire
    for (const tw of s.towers) {
      const st = TSTATS[tw.type];
      const es = effStats(tw.type, tw.level || 1);
      tw.cd = (tw.cd || 0) - dt * 1000;
      if (tw.cd > 0) continue;
      let target = null, bestKey = -Infinity;
      const mode = tw.target || 'first';
      const range = es.range * (s.mut && s.mut.fog ? 0.8 : 1);
      for (const e of s.enemies) {
        if (e.phased) continue;                                  // shade is untargetable while phased
        if (ESTATS[e.type].fly && !['luna','storm','hive'].includes(tw.type)) continue;
        const d = Math.hypot(e.x - tw.x, e.y - tw.y);
        if (d > range) continue;
        const key = mode === 'last' ? -e.dist : mode === 'strong' ? e.hp : mode === 'close' ? -d : e.dist;
        if (key > bestKey) { bestKey = key; target = e; }
      }
      if (target) {
        tw.cd = es.cd; tw.fireT = now;
        s.projs.push({ id: nid(), x: tw.x, y: tw.y - 18, tid: target.id, dmg: es.dmg * (s.mut && s.mut.glass ? 1.5 : 1), sp: st.pspeed, color: st.color, proj: st.proj, splash: st.splash, slow: st.slow });
        BA('fire', tw.type);
      }
    }
    // projectiles
    s.projs = s.projs.filter(pr => {
      const tgt = s.enemies.find(e => e.id === pr.tid);
      if (!tgt) return false;
      const dx = tgt.x - pr.x, dy = (tgt.y - 14) - pr.y, d = Math.hypot(dx, dy) || 1;
      const step = pr.sp * dt;
      if (d <= step + 6) {
        if (tgt.phased) return false;                            // shot passes through a phased shade
        applyDamage(s, tgt, pr.dmg, now);
        BA('hit');
        if (pr.slow) tgt.slowUntil = now + 1400;
        if (pr.splash) { for (const e of s.enemies) { if (e !== tgt && Math.hypot(e.x - tgt.x, e.y - tgt.y) < pr.splash) applyDamage(s, e, pr.dmg * 0.5, now); } }
        return false;
      }
      pr.x += (dx / d) * step; pr.y += (dy / d) * step;
      return true;
    });
    // collect dead
    const born = [];
    for (const e of s.enemies) {
      if (e.hp <= 0 && !e.dead) {
        e.dead = true;
        s.combo += 1; s.lastKill = now; ACH('combo', s.combo);
        const mult = 1 + s.combo * 0.05;
        const reward = Math.round(ESTATS[e.type].gold * (e.child ? 0.4 : 1) * mult);
        s.gold += reward; s.score += Math.round(reward * 10 * mult * (s.scoreMult || 1));
        // splitter spawns two smaller blobs on death
        if (e.type === 'splitter' && !e.child) {
          const chp = Math.max(8, Math.round(ESTATS.splitter.hp * 0.34 * (1 + (s.wave - 1) * 0.08)));
          for (let k = 0; k < 2; k++) {
            born.push({ id: nid(), type: 'splitter', child: true, dist: Math.max(0, e.dist + (k ? 16 : -16)), hp: chp, maxhp: chp, speed: ESTATS.splitter.speed * 1.3, slowUntil: 0, hitUntil: 0, x: e.x, y: e.y });
          }
        }
        if (!REDUCED_MOTION) spawnBurst(s, e.x, e.y);
        BA('kill', s.combo);
        s.floats.push({ id: nid(), x: e.x, y: e.y - 20, text: '+' + reward, color: 'var(--gold)', born: now });
      }
    }
    s.enemies = s.enemies.filter(e => !e.dead);
    if (born.length) for (const b of born) s.enemies.push(b);
    if (s.combo > 0 && now - s.lastKill > 3000) s.combo = 0;
    // particles
    for (const p of s.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; p.life -= dt; }
    s.parts = s.parts.filter(p => p.life > 0);
    s.floats = s.floats.filter(f => now - f.born < 900);
    s.fx = (s.fx || []).filter(r => now - r.born < 600);
    // win / lose / wave-clear
    if (s.lives <= 0) { s.running = false; recordBest(s.wave); setStatus('lost'); BA('lose'); GEM(Math.max(1, Math.floor(s.wave / 3))); DAILY(s); if (s.diff === 'endless') lbAdd(s.score, s.wave, ACTIVE.id, s.mut); }
    else if (s.spawnIdx >= s.queue.length && s.enemies.length === 0 && s.queue.length) {
      s.running = false;
      recordBest(s.wave);
      if (s.total !== Infinity && s.wave >= s.total) { setStatus('won'); BA('win'); GEM(8); ACH('win', { diff: s.diff, biome: ACTIVE.id, flawless: s.lives >= s.startLives }); ACH('gold', s.gold); DAILY(s); }
      else {
        const bonus = 50 + s.wave * 15;
        const interest = Math.round(s.gold * (0.10 + (s.interestBonus || 0)));
        s.lastBonus = bonus; s.lastInterest = interest;
        s.gold += bonus + interest;
        s.score += Math.round(bonus * 5 * (s.scoreMult || 1));
        setStatus('cleared');
        BA('waveClear'); GEM(1); ACH('waveClear'); ACH('gold', s.gold); if (s.total === Infinity) ACH('endless', s.wave);
      }
    }
  };

  // ---- main loop (rAF) + manual step hook for testing ----
  useEffect(() => {
    let raf, last = performance.now();
    const loop = (now) => {
      const dt = Math.min(50, now - last) / 1000; last = now;
      const reps = speedRef.current || 1;
      for (let i = 0; i < reps; i++) stepRef.current(dt);
      render();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // deterministic advance for verification: window.__step(frames, dtMs)
    window.__step = (frames = 60, dtMs = 16) => { for (let i = 0; i < frames; i++) stepRef.current(dtMs / 1000); render(); };
    return () => cancelAnimationFrame(raf);
  }, []);

  const startWave = () => {
    const s = g.current;
    if (s.running || s.enemies.length) return;
    setPending(null);
    s.queue = buildWave(s.wave, s.total, s.diff); s.spawnIdx = 0; s.t0 = CLOCK; s.running = true;
    setStatus('running');
    const boss = s.queue.some(q => q.boss);
    const isFinal = s.total !== Infinity && s.wave >= s.total;
    BA('waveStart', boss);
    setBanner({ key: nid(), boss, text: boss ? (isFinal ? 'FINAL BOSS' : 'BOSS INCOMING') : 'WAVE ' + s.wave, sub: boss ? 'brace yourself' : (s.total !== Infinity ? 'of ' + s.total : 'endless') });
    clearTimeout(bannerTo.current); bannerTo.current = setTimeout(() => setBanner(null), 1650);
  };

  // ---- flow handlers ----
  const confirmLoadout = (picked) => {
    setMap(mapSel);
    g.current = freshState(difficulty || 'bloom');
    if ((difficulty || 'bloom') === 'endless') {
      const m = mutators; g.current.mut = m;
      g.current.scoreMult = 1 + (m.double ? 0.25 : 0) + (m.glass ? 0.4 : 0) + (m.fog ? 0.3 : 0);
      if (m.glass) { const perkLives = g.current.startLives - 20; g.current.lives = 5 + perkLives; g.current.startLives = g.current.lives; }
    }
    setLoadout(picked); setSel(picked[0]); setSelTower(null); setPending(null);
    setStatus('ready'); setScreen('game'); render(); BA('startMusic', 'battle');
    try { if (!localStorage.getItem('bb_onboard')) setCoach(0); } catch (e) {}
  };
  const nextCoach = () => setCoach(c => { if (c >= 2) { try { localStorage.setItem('bb_onboard', '1'); } catch (e) {} return null; } return c + 1; });
  const nextWave = () => { const s = g.current; s.wave += 1; s.queue = []; s.spawnIdx = 0; setPending(null); setStatus('ready'); render(); };
  const openPause = () => { const s = g.current; wasRunning.current = s.running; if (s.running) { s.running = false; s.pausedAt = CLOCK; } setSelTower(null); setPending(null); setPaused(true); };
  const resumeGame = () => { const s = g.current; if (wasRunning.current && status === 'running') { s.t0 += CLOCK - (s.pausedAt || CLOCK); s.running = true; } setPaused(false); };
  const restartFromPause = () => { retryRun(); setPaused(false); setShowSettings(false); };
  const retryRun = () => { setMap(mapSel); g.current = freshState(g.current.diff || difficulty || 'bloom'); setSel((loadout && loadout[0]) || 'blossom'); setSelTower(null); setPending(null); setStatus('ready'); setScreen('game'); render(); BA('startMusic', 'battle'); };
  const quitToMenu = () => { g.current = freshState('bloom'); setSelTower(null); setPending(null); setStatus('ready'); setLoadout(null); setDifficulty(null); setPaused(false); setShowSettings(false); setScreen('menu'); render(); BA('startMusic', 'menu'); };
  const toggleQuick = (k) => changeSettings({ [k]: !settings[k] });
  const startDaily = () => {
    const cfg = (window.BBDaily && window.BBDaily.config()) || { map: 'meadow', diff: 'bloom', loadout: ['blossom', 'storm', 'sugar', 'bubble'] };
    setDifficulty(cfg.diff); setMapSel(cfg.map); setMap(cfg.map);
    g.current = freshState(cfg.diff); g.current.daily = true;
    setLoadout(cfg.loadout); setSel(cfg.loadout[0]); setSelTower(null); setPending(null);
    setStatus('ready'); setScreen('game'); render(); BA('startMusic', 'battle');
  };

  // click a cell: select a placed tower there, else try to place
  const clickCell = (cx, cy) => {
    const s = g.current;
    if (status === 'won' || status === 'lost' || status === 'cleared') return;
    const hit = s.towers.find(t => t.cx === cx && t.cy === cy);
    if (hit) { setPending(null); setSelTower(hit.id); return; }
    setSelTower(null);
    const x = cx * CELL + CELL / 2, y = cy * CELL + CELL / 2;
    if (distToPath(x, y) < 38) return;                 // on path
    if (x <= 0 || y <= 0 || x >= FIELD_W || y >= FIELD_H) return;
    // drop as a PENDING placement (no gold spent until confirmed)
    setPending({ type: sel, cx, cy });
  };
  const selectTower = (k) => { setSel(k); setPending(p => (p ? { ...p, type: k } : p)); };
  const confirmPending = () => {
    const s = g.current; if (!pending) return;
    const cost = TOWERS[pending.type].cost;
    if (s.gold < cost) { triggerShake(setShake, 4); BA('deny'); return; }
    const x = pending.cx * CELL + CELL / 2, y = pending.cy * CELL + CELL / 2;
    s.gold -= cost;
    s.towers.push({ id: nid(), type: pending.type, cx: pending.cx, cy: pending.cy, x, y, level: 1, cd: 0, spent: cost });
    BA('place');
    pushFx(s, x, y - 14, `var(${TOWERS[pending.type].token})`, 'place');
    setPending(null); render();
  };
  const cancelPending = () => setPending(null);
  const cycleTarget = (id) => { const tw = g.current.towers.find(t => t.id === id); if (!tw) return; const m = ['first', 'last', 'strong', 'close']; tw.target = m[(m.indexOf(tw.target || 'first') + 1) % 4]; BA('ui'); render(); };
  const findMergePartner = (tw) => g.current.towers.find(t => t.id !== tw.id && t.type === tw.type && t.level >= 3 && (Math.abs(t.cx - tw.cx) + Math.abs(t.cy - tw.cy)) === 1);
  const mergeTower = (id) => { const s = g.current; const tw = s.towers.find(t => t.id === id); if (!tw || tw.level < 3) return; const p = findMergePartner(tw); if (!p) return; s.towers = s.towers.filter(t => t.id !== p.id); tw.level = 4; tw.prime = true; tw.spent += p.spent; BA('upgrade'); pushFx(s, tw.x, tw.y - 18, 'var(--gold)', 'upgrade'); if (!REDUCED_MOTION) for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2, sp = 80 + Math.random() * 80; s.parts.push({ id: nid(), x: tw.x, y: tw.y - 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life: .6, max: .6, sz: 4 + Math.random() * 4, color: i % 2 ? 'var(--gold)' : '#ffe88a' }); } triggerShake(setShake, 6); render(); };
  const useNova = () => { const s = g.current; if (!s.running || s.abil.nova > 0) return; s.abil.nova = 12000; const dmg = 70 + s.wave * 12; for (const e of s.enemies) { if (!e.phased) applyDamage(s, e, dmg, CLOCK); } triggerShake(setShake, 11); BA('boss'); if (!REDUCED_MOTION) for (const e of s.enemies) spawnBurst(s, e.x, e.y); render(); };
  const useFreeze = () => { const s = g.current; if (!s.running || s.abil.freeze > 0) return; s.abil.freeze = 16000; for (const e of s.enemies) e.slowUntil = CLOCK + 3500; BA('waveClear'); render(); };

  const upgradeTower = (id) => {
    const s = g.current;
    const tw = s.towers.find(t => t.id === id); if (!tw || tw.level >= 3) return;
    const c = upgradeCost(tw.type, tw.level);
    if (s.gold < c) { triggerShake(setShake, 3); return; }
    s.gold -= c; tw.spent += c; tw.level += 1;
    if (tw.level >= 3) ACH('maxTower');
    BA('upgrade');
    pushFx(s, tw.x, tw.y - 18, `var(--${TOWERS[tw.type].family}-light)`, 'upgrade');
    s.floats.push({ id: nid(), x: tw.x, y: tw.y - 48, text: 'LVL ' + tw.level, color: 'var(--gold)', born: CLOCK });
    if (!REDUCED_MOTION) { for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, sp = 70 + Math.random() * 70; s.parts.push({ id: nid(), x: tw.x, y: tw.y - 18, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50, life: .55, max: .55, sz: 4 + Math.random() * 3, color: i % 2 ? 'var(--gold)' : '#ffe88a' }); } }
    render();
  };
  const sellTower = (id) => {
    const s = g.current;
    const tw = s.towers.find(t => t.id === id); if (!tw) return;
    s.gold += Math.round(tw.spent * (0.6 + (s.refundBonus || 0)));
    s.towers = s.towers.filter(t => t.id !== id);
    setSelTower(null); render();
  };

  const s = g.current;
  const cost = TOWERS[sel].cost;
  const canAfford = s.gold >= cost;
  const selT = s.towers.find(t => t.id === selTower);
  const enemiesLeft = s.enemies.length + (s.queue.length - s.spawnIdx);

  return (
    <div className="proto-root" style={{ position: 'relative' }}>
      <TopBar lives={s.lives} gold={s.gold} wave={s.wave} total={s.total} score={s.score} combo={s.combo} onPause={openPause} hurtKey={hurtFx && hurtFx.key} speed={speed} onSpeed={toggleSpeed} />
      <div className="field-wrap" style={{ transform: shake ? `translate(${(Math.random()-.5)*shake}px, ${(Math.random()-.5)*shake}px)` : 'none' }}>
        <div ref={fieldRef} className="field" style={{ width: FIELD_W, height: FIELD_H }}
          onMouseLeave={() => setHoverCell(null)}
          onMouseMove={(ev) => {
            const r = fieldRef.current.getBoundingClientRect();
            const scale = r.width / FIELD_W;
            const cx = Math.floor((ev.clientX - r.left) / scale / CELL);
            const cy = Math.floor((ev.clientY - r.top) / scale / CELL);
            setHoverCell({ cx, cy });
          }}
          onClick={(ev) => {
            const r = fieldRef.current.getBoundingClientRect();
            const scale = r.width / FIELD_W;
            const cx = Math.floor((ev.clientX - r.left) / scale / CELL);
            const cy = Math.floor((ev.clientY - r.top) / scale / CELL);
            clickCell(cx, cy);
          }}>
          <FieldBg mapId={mapSel} />
          <FieldDecor mapId={mapSel} />
          <AmbientLayer mapId={mapSel} />
          {/* depth vignette */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 1490, pointerEvents: 'none', boxShadow: 'inset 0 0 90px 14px rgba(8,5,18,.5)' }} />
          {/* biome hazard zone */}
          {ACTIVE.map.hazard && (() => {
            const h = ACTIVE.map.hazard, frost = h.type === 'slow';
            const col = frost ? 'var(--storm-mid)' : 'var(--sugar-mid)';
            return (
              <div style={{ position: 'absolute', left: h.x, top: h.y, width: h.r * 2, height: h.r * 2, transform: 'translate(-50%,-50%)', borderRadius: '50%', zIndex: 2, pointerEvents: 'none', display: 'grid', placeItems: 'center', background: `radial-gradient(circle, ${frost ? 'rgba(93,184,255,.26)' : 'rgba(255,122,61,.3)'}, transparent 72%)`, border: `2px dashed ${col}`, boxShadow: `0 0 22px -6px ${col}, inset 0 0 26px -8px ${col}` }}>
                <span style={{ fontSize: h.r * 0.55, opacity: 0.85, animation: 'pulse-glow 2.6s ease-in-out infinite' }}>{h.icon || (frost ? '❄️' : '🔥')}</span>
                <span className="num" style={{ position: 'absolute', bottom: -7, fontSize: 9, letterSpacing: '.12em', color: col, background: 'rgba(8,5,18,.7)', padding: '2px 7px', borderRadius: 99, whiteSpace: 'nowrap' }}>{h.label}</span>
              </div>
            );
          })()}
          {/* bastion heart at the exit — reacts when damaged */}
          {(() => {
            const hurt = CLOCK < (s.hurtUntil || 0);
            return (
              <div style={{ position: 'absolute', left: ACTIVE.exit.x, top: ACTIVE.exit.y - 22, transform: 'translate(-50%,-50%)', zIndex: 6, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', left: '50%', top: '50%', width: 52, height: 52, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, rgba(255,77,109,${hurt ? .55 : .2}), transparent 70%)`, transition: 'background .2s' }} />
                <div style={{ position: 'relative', fontSize: 30, lineHeight: 1, transform: `scale(${hurt ? 1.32 : 1})`, transition: 'transform .14s cubic-bezier(.34,1.56,.64,1)', filter: hurt ? 'drop-shadow(0 0 10px var(--danger))' : 'none' }}>{hurt ? '💔' : '❤️'}</div>
                {hurtFx && <div key={hurtFx.key} style={{ position: 'absolute', left: '50%', top: '50%', width: 46, height: 46, border: '3px solid var(--danger)', borderRadius: '50%', animation: 'dmgRing .55s ease-out forwards', pointerEvents: 'none' }} />}
              </div>
            );
          })()}
          {/* placement ghost + range */}
          {!pending && hoverCell && (status === 'ready' || status === 'running') && (() => {
            const x = hoverCell.cx * CELL + CELL / 2, y = hoverCell.cy * CELL + CELL / 2;
            const onPath = distToPath(x, y) < 38;
            const occupied = s.towers.some(t => t.cx === hoverCell.cx && t.cy === hoverCell.cy);
            const inb = x > 0 && y > 0 && x < FIELD_W && y < FIELD_H;
            const ok = !onPath && !occupied && canAfford && inb;
            const accent = ok ? 'var(--success)' : 'var(--danger)';
            const st = TSTATS[sel];
            return (
              <React.Fragment>
                {/* range ring centered on the tile */}
                <div style={{ position: 'absolute', left: x, top: y, width: st.range * 2, height: st.range * 2, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `2px dashed ${accent}`, background: `radial-gradient(circle, ${ok ? 'rgba(68,224,138,.12)' : 'rgba(255,77,109,.12)'}, transparent 70%)`, pointerEvents: 'none', zIndex: 50 }} />
                {/* tile highlight so it's obvious which cell */}
                <div style={{ position: 'absolute', left: hoverCell.cx * CELL + 4, top: hoverCell.cy * CELL + 4, width: CELL - 8, height: CELL - 8, borderRadius: 10, border: `2px solid ${accent}`, background: ok ? 'rgba(68,224,138,.16)' : 'rgba(255,77,109,.16)', boxShadow: `inset 0 0 12px ${ok ? 'rgba(68,224,138,.3)' : 'rgba(255,77,109,.3)'}`, pointerEvents: 'none', zIndex: 51 }} />
                {/* ghost tower — anchored exactly like a placed tower */}
                <div style={{ position: 'absolute', left: x, top: y, width: 58, height: 72, transform: 'translate(-50%,-72%)', opacity: .7, pointerEvents: 'none', zIndex: 52, filter: `drop-shadow(0 0 6px ${accent})`, ...skinVars(TOWERS[sel].family) }}><TowerGlyph type={sel} level={1} /></div>
              </React.Fragment>
            );
          })()}
          {/* PENDING placement — awaiting confirm */}
          {pending && (() => {
            const x = pending.cx * CELL + CELL / 2, y = pending.cy * CELL + CELL / 2;
            const st = TSTATS[pending.type];
            const cost = TOWERS[pending.type].cost;
            const afford = s.gold >= cost;
            const accent = afford ? 'var(--success)' : 'var(--danger)';
            const below = y < 116;                 // put the bubble below if near the top edge
            const bubbleY = below ? y + 30 : y - 80;
            return (
              <React.Fragment>
                <div style={{ position: 'absolute', left: x, top: y, width: st.range * 2, height: st.range * 2, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `2px dashed ${accent}`, background: `radial-gradient(circle, ${afford ? 'rgba(68,224,138,.12)' : 'rgba(255,77,109,.12)'}, transparent 70%)`, pointerEvents: 'none', zIndex: 50 }} />
                <div style={{ position: 'absolute', left: pending.cx * CELL + 4, top: pending.cy * CELL + 4, width: CELL - 8, height: CELL - 8, borderRadius: 10, border: `2px solid ${accent}`, background: afford ? 'rgba(68,224,138,.18)' : 'rgba(255,77,109,.18)', boxShadow: `inset 0 0 12px ${afford ? 'rgba(68,224,138,.35)' : 'rgba(255,77,109,.35)'}`, pointerEvents: 'none', zIndex: 51 }} />
                <div style={{ position: 'absolute', left: x, top: y, width: 58, height: 72, transform: 'translate(-50%,-72%)', pointerEvents: 'none', zIndex: 900, animation: 'bob-sm 1.1s ease-in-out infinite', filter: `drop-shadow(0 0 9px ${accent})`, ...skinVars(TOWERS[pending.type].family) }}><TowerGlyph type={pending.type} level={1} /></div>
                {/* confirm / cancel controls */}
                <div style={{ position: 'absolute', left: x, top: bubbleY, transform: 'translate(-50%,-50%)', zIndex: 1600, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(14,8,32,.92)', border: '1px solid var(--bg-line)', borderRadius: 999, padding: '5px 6px', boxShadow: '0 8px 22px -8px #000' }}>
                  <button onClick={(ev) => { ev.stopPropagation(); cancelPending(); }} title="Cancel" style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--bg-line)', background: 'var(--bg-panel)', color: 'var(--danger)', cursor: 'pointer', fontSize: 15, fontWeight: 800, display: 'grid', placeItems: 'center' }}>✕</button>
                  <span className="num" style={{ fontSize: 13, color: afford ? 'var(--gold)' : 'var(--danger)', padding: '0 4px', whiteSpace: 'nowrap' }}>💰 {cost}</span>
                  <button onClick={(ev) => { ev.stopPropagation(); confirmPending(); }} disabled={!afford} title={afford ? 'Confirm' : 'Not enough gold'} style={{ width: 34, height: 34, borderRadius: '50%', border: 0, cursor: afford ? 'pointer' : 'default', fontSize: 16, fontWeight: 800, display: 'grid', placeItems: 'center', color: afford ? '#06301c' : 'var(--text-dim)', background: afford ? 'linear-gradient(180deg,var(--success),#2aa866)' : 'var(--bg-elevated)', boxShadow: afford ? '0 3px 0 #1c7a48' : 'none' }}>✓</button>
                </div>
              </React.Fragment>
            );
          })()}

          {/* towers */}
          {s.towers.map(tw => (
            <div key={tw.id} style={{ position: 'absolute', left: tw.x, top: tw.y, width: 58, height: 72, transform: 'translate(-50%,-72%)', zIndex: Math.round(tw.y), ...skinVars(TOWERS[tw.type].family) }}>
              {tw.id === selTower && <div style={{ position: 'absolute', left: '50%', bottom: 2, transform: 'translateX(-50%)', width: 46, height: 16, borderRadius: '50%', background: `var(--${tw.family || TOWERS[tw.type].family}-mid)`, opacity: .35, filter: 'blur(3px)' }} />}
              {tw.level >= 4 && <div style={{ position: 'absolute', left: '50%', bottom: 6, transform: 'translateX(-50%)', width: 52, height: 52, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,215,0,.5), transparent 70%)', animation: 'pulse-glow 1.9s ease-in-out infinite', zIndex: -1 }} />}
              <TowerGlyph type={tw.type} level={Math.min(tw.level, 3)} />
              {tw.level >= 4 && <span style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', fontSize: 15, filter: 'drop-shadow(0 0 4px var(--gold))' }}>👑</span>}
            </div>
          ))}
          {/* selected tower: range ring + upgrade/sell popover */}
          {selT && (() => {
            const es = effStats(selT.type, selT.level);
            const fam = TOWERS[selT.type].family;
            const maxed = selT.level >= 3;
            const partner = maxed && selT.level < 4 ? findMergePartner(selT) : null;
            const uc = upgradeCost(selT.type, selT.level);
            const refund = Math.round(selT.spent * 0.6);
            const popLeft = Math.max(96, Math.min(FIELD_W - 96, selT.x));
            const above = selT.y > 150;
            const popTop = above ? selT.y - 96 : selT.y + 28;
            return (
              <React.Fragment>
                <div style={{ position: 'absolute', left: selT.x, top: selT.y, transform: 'translate(-50%,-50%)', width: es.range * 2, height: es.range * 2, borderRadius: '50%', border: `2px dashed var(--${fam}-light)`, background: `radial-gradient(circle, color-mix(in oklch, var(--${fam}-mid) 18%, transparent), transparent 72%)`, pointerEvents: 'none', zIndex: 800 }} />
                <div style={{ position: 'absolute', left: popLeft, top: popTop, transform: 'translateX(-50%)', zIndex: 1500, width: 190, background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: `1px solid var(--${fam}-dark)`, borderRadius: 14, boxShadow: 'var(--shadow-panel)', padding: 11 }}>
                  <div className="row between" style={{ alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, lineHeight: 1 }}>{TOWERS[selT.type].emoji} {TOWERS[selT.type].name}</span>
                    <span className="tag" style={{ fontSize: 9, padding: '2px 7px', color: `var(--${fam}-mid)` }}>{selT.level >= 4 ? '👑 PRIME' : `LVL ${selT.level}`}</span>
                  </div>
                  <div className="row gap2" style={{ marginBottom: 10 }}>
                    <span style={{ flex: 1, background: 'var(--bg-abyss)', borderRadius: 8, padding: '4px 8px' }}><span className="num" style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.1em' }}>DMG </span><span className="num" style={{ fontSize: 13, color: 'var(--text-bright)' }}>{Math.round(es.dmg)}</span></span>
                    <span style={{ flex: 1, background: 'var(--bg-abyss)', borderRadius: 8, padding: '4px 8px' }}><span className="num" style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.1em' }}>RNG </span><span className="num" style={{ fontSize: 13, color: 'var(--text-bright)' }}>{Math.round(es.range)}</span></span>
                  </div>
                  <div className="row between" style={{ marginBottom: 9, alignItems: 'center', background: 'var(--bg-abyss)', borderRadius: 8, padding: '4px 6px 4px 9px' }}>
                    <span className="num" style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: '.1em' }}>TARGET</span>
                    <button onClick={(ev) => { ev.stopPropagation(); cycleTarget(selT.id); }} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: `var(--${fam}-mid)`, background: 'var(--bg-panel)', border: '1px solid var(--bg-line)', borderRadius: 7, padding: '3px 10px', cursor: 'pointer' }}>{({ first: 'First', last: 'Last', strong: 'Strongest', close: 'Closest' })[selT.target || 'first']} ↻</button>
                  </div>
                  <div className="row gap2">
                    {selT.level >= 4
                      ? <button disabled style={{ flex: 2, minHeight: 36, borderRadius: 9, border: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#2a1d00', background: 'linear-gradient(180deg,#ffe88a,var(--gold))', boxShadow: '0 0 12px -3px var(--gold)' }}>👑 PRIME</button>
                      : partner
                        ? <button onClick={(ev) => { ev.stopPropagation(); mergeTower(selT.id); }} style={{ flex: 2, minHeight: 36, borderRadius: 9, border: 0, cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#1a0f2e', background: 'linear-gradient(180deg,var(--luna-light),var(--luna-mid))', boxShadow: '0 0 12px -3px var(--luna-mid)' }}>⬡ Merge → Prime</button>
                        : <button onClick={(ev) => { ev.stopPropagation(); upgradeTower(selT.id); }} disabled={maxed} style={{ flex: 2, minHeight: 36, borderRadius: 9, border: 0, cursor: maxed ? 'default' : 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: maxed ? 'var(--text-dim)' : '#2a1d00', background: maxed ? 'var(--bg-elevated)' : 'linear-gradient(180deg,#ffe88a,var(--gold))' }}>{maxed ? 'MAX LEVEL' : `⬆ 💰${uc}`}</button>}
                    <button onClick={(ev) => { ev.stopPropagation(); sellTower(selT.id); }} style={{ flex: 1, minHeight: 36, borderRadius: 9, border: '1px solid var(--bg-line)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--danger)', background: 'var(--bg-panel)' }}>Sell {refund}</button>
                  </div>
                  {maxed && selT.level < 4 && <div className="num" style={{ fontSize: 9.5, color: partner ? 'var(--luna-light)' : 'var(--text-faint)', textAlign: 'center', marginTop: 6 }}>{partner ? 'Fuses with the adjacent Lv.3 — ×2.8 dmg!' : 'Place another Lv.3 of this tower next to it to merge'}</div>}
                </div>
              </React.Fragment>
            );
          })()}
          {/* enemies */}
          {s.enemies.map(e => {
            const sc = ESTATS[e.type].scale * (e.child ? 0.62 : 1);
            const flash = CLOCK < e.hitUntil;
            return (
              <div key={e.id} style={{ position: 'absolute', left: e.x || 0, top: e.y || 0, width: 70 * sc, height: 70 * sc, transform: 'translate(-50%,-62%)', zIndex: Math.round(e.y || 0) + 1, opacity: e.phased ? 0.38 : 1, transition: 'opacity .18s linear', filter: flash ? 'brightness(3) saturate(0)' : (e.phased ? 'grayscale(.5) drop-shadow(0 0 6px var(--shade-glow))' : 'none') }}>
                {!e.phased && <div style={{ position: 'absolute', left: '50%', top: -10, transform: 'translateX(-50%)', width: 40 }}>
                  <HpBar pct={Math.max(0, e.hp / e.maxhp)} />
                </div>}
                <EnemyGlyph type={e.type} />
              </div>
            );
          })}
          {/* projectiles */}
          {s.projs.map(pr => (
            <div key={pr.id} style={{ position: 'absolute', left: pr.x, top: pr.y, width: 12, height: 12, borderRadius: pr.proj === 'beam' ? 2 : 99, background: pr.color, boxShadow: `0 0 10px ${pr.color}`, transform: 'translate(-50%,-50%)', zIndex: 999 }} />
          ))}
          {/* particles */}
          {s.parts.map(p => (
            <div key={p.id} style={{ position: 'absolute', left: p.x, top: p.y, width: p.sz, height: p.sz, borderRadius: 2, background: p.color, transform: 'translate(-50%,-50%)', opacity: Math.max(0, p.life / p.max), zIndex: 1000 }} />
          ))}
          {/* floating gold */}
          {s.floats.map(f => (
            <div key={f.id} className="num" style={{ position: 'absolute', left: f.x, top: f.y, transform: 'translate(-50%,-50%)', color: f.color, fontWeight: 800, fontSize: f.big ? 23 : 15, textShadow: f.big ? '0 2px 6px #000, 0 0 12px var(--danger)' : '0 1px 3px #000', animation: 'floatup .9s ease-out forwards', zIndex: 1001 }}>{f.text}</div>
          ))}

          {/* damage vignette flash — bursts from the heart */}
          {hurtFx && <div key={'vig' + hurtFx.key} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1800, background: `radial-gradient(circle at ${ACTIVE.exit.x}px ${ACTIVE.exit.y}px, rgba(255,77,109,.5), transparent 46%)`, animation: 'dmgVignette .52s ease-out forwards' }} />}

          {/* placement / upgrade rings */}
          {(s.fx || []).map(r => { const size = r.kind === 'upgrade' ? 70 : 54; const bw = r.kind === 'upgrade' ? 4 : 3; return (
            <div key={r.id} style={{ position: 'absolute', left: r.x, top: r.y, width: size, height: size, border: `${bw}px solid ${r.color}`, borderRadius: '50%', transform: 'translate(-50%,-50%)', animation: 'ringPop .55s ease-out forwards', pointerEvents: 'none', zIndex: 1200, boxShadow: `0 0 12px ${r.color}` }} />
          ); })}

          {/* wave-start banner */}
          {banner && (
            <div key={banner.key} style={{ position: 'absolute', left: 0, right: 0, top: '36%', zIndex: 1900, pointerEvents: 'none', textAlign: 'center', animation: 'bannerSweep 1.65s ease-out forwards' }}>
              <div style={{ display: 'inline-block', padding: '12px 44px', background: banner.boss ? 'linear-gradient(90deg, transparent, rgba(255,77,109,.92), transparent)' : 'linear-gradient(90deg, transparent, rgba(36,21,68,.94), transparent)', borderTop: `2px solid ${banner.boss ? 'var(--danger)' : 'var(--bubble-mid)'}`, borderBottom: `2px solid ${banner.boss ? 'var(--danger)' : 'var(--bubble-mid)'}` }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '.06em', color: '#fff6ff', textShadow: `0 0 20px ${banner.boss ? 'var(--danger)' : 'var(--bubble-mid)'}`, lineHeight: 1 }}>{banner.text}</div>
                {banner.sub && <div className="num" style={{ fontSize: 12, letterSpacing: '.3em', color: 'var(--text-soft)', marginTop: 4 }}>{banner.sub.toUpperCase()}</div>}
              </div>
            </div>
          )}

          {/* in-field end overlay removed — handled by full-screen flow overlays below */}
        </div>
      </div>
      <Dock sel={sel} setSel={selectTower} gold={s.gold} status={status} onStart={startWave} enemiesLeft={enemiesLeft} keys={loadout || Object.keys(TOWERS)} abil={s.abil} onNova={useNova} onFreeze={useFreeze} />

      {screen === 'menu' && <MainMenu best={best.current} gems={window.BBShop ? window.BBShop.getGems() : 0} ach={window.BBAch ? window.BBAch.count() : 0} achTotal={window.BBAch ? window.BBAch.total() : 0} dailyBest={window.BBDaily ? window.BBDaily.best() : 0} onPlay={() => setScreen('difficulty')} onEndless={() => { setDifficulty('endless'); setScreen('endless'); }} onShop={() => setShowShop(true)} onSettings={() => setShowSettings(true)} onAch={() => setShowAch(true)} onDaily={startDaily} />}
      {screen === 'endless' && <EndlessSetup mutators={mutators} setMutators={setMutators} onContinue={() => setScreen('map')} onBack={() => setScreen('menu')} />}
      {screen === 'difficulty' && <DifficultySelect onPick={(k) => { setDifficulty(k); setScreen('map'); }} onBack={() => setScreen('menu')} />}
      {screen === 'map' && <MapSelect current={mapSel} onPick={(id) => { setMapSel(id); setMap(id); setScreen('loadout'); }} onBack={() => setScreen(difficulty === 'endless' ? 'endless' : 'difficulty')} />}
      {screen === 'loadout' && <LoadoutOverlay onConfirm={confirmLoadout} onBack={() => setScreen('map')} />}
      {screen === 'game' && status === 'cleared' && <WaveClearOverlay wave={s.wave} total={s.total} bonus={s.lastBonus} interest={s.lastInterest} onNext={nextWave} />}
      {screen === 'game' && status === 'won' && <VictoryOverlay score={s.score} onRetry={retryRun} onMenu={quitToMenu} />}
      {screen === 'game' && status === 'lost' && <DefeatOverlay wave={s.wave} total={s.total} score={s.score} onRetry={retryRun} onMenu={quitToMenu} />}
      {paused && <PauseMenu wave={s.wave} enemiesLeft={enemiesLeft} settings={settings} onResume={resumeGame} onRestart={restartFromPause} onSettings={() => setShowSettings(true)} onQuit={quitToMenu} onQuick={toggleQuick} />}
      {showSettings && <SettingsPanel settings={settings} onChange={changeSettings} onClose={() => setShowSettings(false)} onAccount={() => setShowAccount(true)} />}
      {menuInfo && <InfoOverlay icon={menuInfo.icon} title={menuInfo.title} text={menuInfo.text} onClose={() => setMenuInfo(null)} />}
      {showShop && window.ShopScreen && <ShopScreen onClose={() => setShowShop(false)} />}
      {showAch && window.AchScreen && <AchScreen onClose={() => setShowAch(false)} />}
      {showAccount && window.AccountScreen && <AccountScreen onClose={() => setShowAccount(false)} />}
      {window.AchToast && <AchToast />}
      {coach != null && screen === 'game' && (() => {
        const tips = ['Pick a tower below, then tap a grass tile to preview it.', 'Tap the green ✓ to confirm — gold is only spent then.', 'Hit START WAVE and defend the heart!'];
        return (
          <div onClick={nextCoach} style={{ position: 'absolute', inset: 0, zIndex: 2000, background: 'rgba(8,5,18,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 92, cursor: 'pointer' }}>
            <div style={{ maxWidth: 300, textAlign: 'center', background: 'linear-gradient(180deg,#ffe88a,var(--gold))', color: '#2a1d00', borderRadius: 16, padding: '14px 18px', boxShadow: '0 10px 30px -8px #000', animation: 'achPop .35s ease' }}>
              <div className="num" style={{ fontSize: 9.5, letterSpacing: '.18em', opacity: .7 }}>TIP {coach + 1} / 3</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1.3, marginTop: 4 }}>{tips[coach]}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, marginTop: 8, opacity: .8 }}>{coach < 2 ? 'Tap to continue →' : 'Got it! →'}</div>
            </div>
            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '10px solid var(--gold)' }} />
          </div>
        );
      })()}
    </div>
  );
}

function applyDamage(s, e, dmg, now) { e.hp -= dmg; e.hitUntil = now + 110; }
function effStats(type, level) {
  const st = TSTATS[type]; const k = (level || 1) - 1;
  return { dmg: st.dmg * (1 + k * 0.6), range: st.range * (1 + k * 0.15), cd: st.cd * (1 - k * 0.12) };
}
function upgradeCost(type, level) { return Math.round(TOWERS[type].cost * (level === 1 ? 1.4 : 2.6)); }
function spawnBurst(s, x, y) {
  const colors = ['var(--blossom-mid)','var(--gold)','var(--bubble-mid)','var(--luna-mid)','#fff'];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, sp = 90 + Math.random() * 120;
    s.parts.push({ id: nid(), x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: .55, max: .55, sz: 5 + Math.random() * 4, color: colors[i % colors.length] });
  }
}
function triggerShake(setShake, amt) { if (!SHAKE_ENABLED) return; setShake(amt); setTimeout(() => setShake(0), 220); }

// ---------- FIELD BACKGROUND ----------
const FieldBg = memo(function FieldBg({ mapId }) {
  const A = ACTIVE, c = A.map.c;
  const d = A.waypoints.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  let seed = 7; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const tufts = [];
  for (let i = 0; i < 80; i++) { const x = rnd() * FIELD_W, y = rnd() * FIELD_H, sc = 0.7 + rnd() * 0.7; if (distToPath(x, y) < 42) continue; tufts.push({ x, y, sc }); }
  const patches = [];
  for (let i = 0; i < 10; i++) { const x = rnd() * FIELD_W, y = rnd() * FIELD_H; if (distToPath(x, y) < 50) continue; patches.push({ x, y, rx: 40 + rnd() * 50, ry: 26 + rnd() * 26, light: rnd() > 0.5 }); }
  const entry = A.waypoints[0], ex = A.exit.x, ey = A.exit.y;
  return (
    <svg width={FIELD_W} height={FIELD_H} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="grassG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.grassTop} /><stop offset="1" stopColor={c.grassBot} /></linearGradient>
        <linearGradient id="pathG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c.pathTop} /><stop offset="1" stopColor={c.pathBot} /></linearGradient>
        <radialGradient id="portalG" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={c.portalIn} /><stop offset="0.6" stopColor={c.portalMid} /><stop offset="1" stopColor={c.portalOut} /></radialGradient>
        <pattern id="grasscells" width={CELL} height={CELL} patternUnits="userSpaceOnUse"><rect width={CELL} height={CELL} fill="none" stroke="rgba(0,0,0,.08)" /></pattern>
      </defs>

      {/* ground base + soft patches + faint build grid */}
      <rect width={FIELD_W} height={FIELD_H} fill="url(#grassG)" />
      {patches.map((p, i) => <ellipse key={i} cx={p.x} cy={p.y} rx={p.rx} ry={p.ry} fill={p.light ? c.patchA : c.patchB} opacity="0.35" />)}
      <rect width={FIELD_W} height={FIELD_H} fill="url(#grasscells)" />

      {/* enemy spawn portal at the entrance */}
      <g transform={`translate(${entry.x < 0 ? 6 : entry.x} ${entry.y})`}>
        <ellipse cx="0" cy="34" rx="30" ry="8" fill="#000" opacity="0.22" />
        <ellipse cx="0" cy="0" rx="30" ry="34" fill={c.portalIn} />
        <ellipse cx="0" cy="0" rx="23" ry="27" fill="url(#portalG)" />
        <path d="M-14 -10 Q0 0 14 -10" stroke={c.swirl} strokeWidth="2.4" fill="none" opacity="0.8" style={{ animation: 'spin-slow 6s linear infinite', transformOrigin: '0px 0px' }} />
        <circle cx="0" cy="0" r="4" fill={c.swirl} style={{ animation: 'pulse-glow 2.2s ease-in-out infinite', transformOrigin: '0px 0px' }} />
      </g>

      {/* path: shadow → rim → fill → lighter centre → dashed line */}
      <path d={d} fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="58" strokeLinejoin="round" strokeLinecap="round" transform="translate(0 5)" />
      <path d={d} fill="none" stroke={c.pathRim} strokeWidth="56" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="url(#pathG)" strokeWidth="48" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={c.pathCenter} strokeWidth="26" strokeLinejoin="round" strokeLinecap="round" opacity="0.5" />
      <path d={d} fill="none" stroke={c.dash} strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="3 22" opacity="0.6" />

      {/* tufts */}
      {tufts.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.sc})`} opacity="0.85">
          <path d="M0 0 Q-3 -7 -4 -10" stroke={c.tuft} strokeWidth="1.7" fill="none" strokeLinecap="round" />
          <path d="M0 0 Q0 -8 0 -12" stroke={c.tuft} strokeWidth="1.7" fill="none" strokeLinecap="round" opacity="0.7" />
          <path d="M0 0 Q3 -7 4 -10" stroke={c.tuft} strokeWidth="1.7" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* bastion keep at the exit (heart crowns it, drawn in React above) */}
      <g transform={`translate(${ex} ${ey + 8})`}>
        <ellipse cx="0" cy="30" rx="26" ry="6" fill="#000" opacity="0.28" />
        <rect x="-22" y="-2" width="44" height="34" rx="5" fill={c.keepBody} stroke="var(--bg-line)" strokeWidth="2" />
        {[-22, -13, -4, 5, 14].map((x, i) => <rect key={i} x={x} y="-9" width="8" height="9" rx="1.5" fill={c.keepBody} stroke="var(--bg-line)" strokeWidth="1.5" />)}
        <rect x="-7" y="14" width="14" height="18" rx="6" fill="var(--bg-abyss)" />
        <rect x="-22" y="6" width="44" height="3" fill={c.keepTrim} opacity="0.6" />
      </g>
    </svg>
  );
});

// decorative props scattered on the ground (purely visual, non-blocking)
const FieldDecor = memo(function FieldDecor({ mapId }) {
  const items = (ACTIVE.map.props || []).filter(([k, x, y]) => distToPath(x, y) > 30);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3 }}>
      {items.map(([k, x, y, sz], i) => { const C = PROPS[k].comp; return (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: sz, height: sz, transform: 'translate(-50%,-70%)', opacity: 0.92 }}><C /></div>
      ); })}
    </div>
  );
});

// ---------- AMBIENT PARTICLES (biome-aware atmosphere) ----------
const AmbientLayer = memo(function AmbientLayer({ mapId }) {
  const biome = ACTIVE.id;
  const color = biome === 'frost' ? '#eaf6ff' : biome === 'ember' ? '#ff9a4d' : '#ffd6e8';
  let seed = 42; const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const bits = []; for (let i = 0; i < 16; i++) bits.push({ x: rnd() * FIELD_W, size: 4 + rnd() * 6, dur: 7 + rnd() * 7, delay: -rnd() * 14, dx: rnd() * 60 - 30 });
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1500, pointerEvents: 'none', overflow: 'hidden' }}>
      {bits.map((b, i) => (
        <div key={i} style={{ position: 'absolute', left: b.x, top: 0, width: b.size, height: biome === 'ember' ? b.size : b.size * 1.4, borderRadius: biome === 'ember' ? '50%' : '50% 0 50% 50%', background: color, opacity: 0.7, boxShadow: biome === 'ember' ? `0 0 6px ${color}` : 'none', '--dx': b.dx + 'px', animation: `ambientFall ${b.dur}s linear ${b.delay}s infinite` }} />
      ))}
    </div>
  );
});

// ---------- ENDLESS SETUP (mutators + leaderboard) ----------
function EndlessSetup({ mutators, setMutators, onContinue, onBack }) {
  const MUT = [
    ['double', '⚡', 'Double Time', 'Enemies move 1.5× faster', '+25%'],
    ['glass', '💎', 'Glass Cannon', 'Towers hit +50% · only 5 lives', '+40%'],
    ['fog', '🌫️', 'Fog of War', 'Tower range −20%', '+30%'],
  ];
  const lb = lbGet();
  const mult = 1 + (mutators.double ? 0.25 : 0) + (mutators.glass ? 0.4 : 0) + (mutators.fog ? 0.3 : 0);
  const toggle = (k) => setMutators(m => ({ ...m, [k]: !m[k] }));
  return (
    <div onClick={onBack} style={{ position: 'absolute', inset: 0, zIndex: 2550, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'calc(100% - 12px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
        <div style={{ padding: '15px 18px 8px', textAlign: 'center', position: 'relative', flex: '0 0 auto' }}>
          <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', left: 16, top: 14, width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-display)', paddingBottom: 2 }}>‹</button>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23 }}>♾ Endless</div>
          <div className="muted" style={{ fontSize: 12 }}>Stack mutators for a higher score</div>
        </div>
        <div style={{ overflowY: 'auto', padding: '6px 16px 14px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--luna-mid)', margin: '8px 4px 7px' }}>Mutators</div>
          <div className="col gap2">
            {MUT.map(([k, ic, nm, sub, bonus]) => { const on = mutators[k]; return (
              <button key={k} onClick={() => toggle(k)} className="row between" style={{ padding: '10px 12px', borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left', background: on ? 'var(--bg-elevated)' : 'var(--bg-panel)', border: `1.5px solid ${on ? 'var(--luna-mid)' : 'var(--bg-line)'}`, boxShadow: on ? '0 0 12px -4px var(--luna-mid)' : 'none' }}>
                <div className="row gap3" style={{ alignItems: 'center', minWidth: 0 }}>
                  <span style={{ fontSize: 19 }}>{ic}</span>
                  <div style={{ minWidth: 0 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14 }}>{nm}</div><div className="muted" style={{ fontSize: 11.5 }}>{sub}</div></div>
                </div>
                <div className="row gap2" style={{ alignItems: 'center', flex: '0 0 auto' }}>
                  <span className="num" style={{ fontSize: 12, color: 'var(--gold)' }}>{bonus}</span>
                  <div style={{ width: 20, height: 20, borderRadius: 6, display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, background: on ? 'var(--luna-mid)' : 'transparent', border: `1.5px solid ${on ? 'var(--luna-mid)' : 'var(--bg-line)'}`, color: '#1a0f2e' }}>{on ? '✓' : ''}</div>
                </div>
              </button>
            ); })}
          </div>
          <div className="row between" style={{ marginTop: 12, padding: '8px 12px', borderRadius: 'var(--r-md)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)' }}>
            <span className="num" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.1em' }}>SCORE MULTIPLIER</span>
            <span className="num" style={{ fontSize: 16, color: 'var(--gold)', fontWeight: 800 }}>×{mult.toFixed(2)}</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 9.5, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--luna-mid)', margin: '16px 4px 7px' }}>🏆 Hall of Fame</div>
          {lb.length === 0
            ? <div style={{ textAlign: 'center', padding: '20px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-abyss)', border: '1px dashed var(--bg-line)' }}><div style={{ fontSize: 26, opacity: .6 }}>♾️</div><div className="muted" style={{ fontSize: 12, marginTop: 4 }}>No runs yet — survive the gauntlet to claim the top spot!</div></div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {lb.map((r, i) => {
                  const medal = ['🥇', '🥈', '🥉'][i]; const isNew = r.t && r.t === LAST_LB;
                  const accent = i === 0 ? 'var(--gold)' : i === 1 ? '#cfd6e6' : i === 2 ? 'var(--hive-mid)' : 'var(--text-soft)';
                  const mapGlyph = (MAPS[r.map] && MAPS[r.map].biome) || '🌼';
                  return (
                    <div key={i} className="row between" style={{ alignItems: 'center', padding: '8px 11px', borderRadius: 'var(--r-md)', background: isNew ? 'rgba(255,215,0,.12)' : 'var(--bg-panel)', border: `1px solid ${isNew ? 'var(--gold-deep)' : 'var(--bg-line)'}`, boxShadow: i === 0 ? '0 0 14px -6px var(--gold)' : 'none' }}>
                      <div className="row gap3" style={{ alignItems: 'center', minWidth: 0 }}>
                        <span style={{ width: 24, textAlign: 'center', fontSize: medal ? 16 : 13, fontFamily: 'var(--font-display)', fontWeight: 800, color: accent }}>{medal || (i + 1)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div className="num" style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? 'var(--gold)' : 'var(--text-bright)' }}>{r.score.toLocaleString()}{isNew && <span className="num" style={{ fontSize: 8.5, letterSpacing: '.12em', color: '#2a1d00', background: 'linear-gradient(180deg,#ffe88a,var(--gold))', padding: '1px 6px', borderRadius: 99, marginLeft: 7, verticalAlign: 'middle' }}>NEW</span>}</div>
                          <div className="muted" style={{ fontSize: 10.5 }}>wave {r.wave} · {r.d}</div>
                        </div>
                      </div>
                      <div className="row gap2" style={{ alignItems: 'center', flex: '0 0 auto' }}>
                        {r.mults > 0 && <span className="num" style={{ fontSize: 10, color: 'var(--luna-light)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 99, padding: '2px 7px' }}>⚡{r.mults}</span>}
                        <span style={{ fontSize: 15 }} title={MAPS[r.map] ? MAPS[r.map].name : ''}>{mapGlyph}</span>
                      </div>
                    </div>
                  );
                })}
              </div>}
        </div>
        <div style={{ padding: '10px 16px 16px', flex: '0 0 auto', borderTop: '1px solid var(--bg-line)' }}>
          <button onClick={onContinue} className="btn btn-gold" style={{ width: '100%', minHeight: 50, fontSize: 16 }}>Continue →</button>
        </div>
      </div>
    </div>
  );
}

// ---------- MAP / BIOME SELECT ----------
function MapSelect({ current, onPick, onBack }) {
  return (
    <div onClick={onBack} style={{ position: 'absolute', inset: 0, zIndex: 2560, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 6px', textAlign: 'center', position: 'relative' }}>
          <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', left: 16, top: 14, width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-display)', paddingBottom: 2 }}>‹</button>
          <div className="num" style={{ fontSize: 10, letterSpacing: '.26em', color: 'var(--luna-mid)' }}>BATTLEFIELD</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23, marginTop: 3 }}>Pick your biome</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, padding: '12px 18px 20px' }}>
          {Object.keys(MAPS).map(id => {
            const m = MAPS[id], sel = current === id, c = m.c;
            const dstr = m.waypoints.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
            return (
              <button key={id} onClick={() => onPick(id)} style={{ padding: 8, borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'center', background: sel ? 'var(--bg-elevated)' : 'var(--bg-panel)', border: `1.5px solid ${sel ? c.portalOut : 'var(--bg-line)'}`, boxShadow: sel ? `0 0 14px -4px ${c.portalOut}` : 'none' }}>
                <svg viewBox="0 0 780 500" preserveAspectRatio="xMidYMid slice" style={{ width: '100%', height: 70, borderRadius: 8, display: 'block', background: `linear-gradient(180deg, ${c.grassTop}, ${c.grassBot})` }}>
                  <path d={dstr} fill="none" stroke={c.pathRim} strokeWidth="46" strokeLinejoin="round" strokeLinecap="round" />
                  <path d={dstr} fill="none" stroke={c.pathBot} strokeWidth="36" strokeLinejoin="round" strokeLinecap="round" />
                  <circle cx={Math.min(740, m.waypoints[m.waypoints.length - 1].x)} cy={m.waypoints[m.waypoints.length - 1].y} r="20" fill={c.keepBody} stroke={c.keepTrim} strokeWidth="5" />
                </svg>
                <div style={{ fontSize: 20, marginTop: 6 }}>{m.biome}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--text-bright)' }}>{m.name}</div>
                <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>{m.tag}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HpBar({ pct }) {
  const c = pct > 0.55 ? 'var(--hp-high)' : pct > 0.28 ? 'var(--hp-mid)' : 'var(--hp-low)';
  return (
    <div style={{ height: 5, borderRadius: 99, background: 'rgba(0,0,0,.6)', padding: 1, border: '1px solid rgba(255,255,255,.15)' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 99, background: c }} />
    </div>
  );
}

// ---------- HUD ----------
function TopBar({ lives, gold, wave, total, score, combo, onPause, hurtKey, speed, onSpeed }) {
  const chip = (icon, val, color) => (
    <div className="chip"><span style={{ fontSize: 15 }}>{icon}</span><span className="num" style={{ color, fontSize: 17 }}>{val}</span></div>
  );
  const waveLabel = total && total !== Infinity ? `${wave}/${total}` : `${wave}`;
  return (
    <div className="topbar-game">
      <div className="row gap2">
        <span key={hurtKey || 0} className="chip" style={{ animation: hurtKey ? 'chipHurt .5s ease' : undefined, boxShadow: hurtKey ? '0 0 0 2px var(--danger), 0 0 14px -2px var(--danger)' : undefined }}><span style={{ fontSize: 15 }}>❤️</span><span className="num" style={{ color: 'var(--danger)', fontSize: 17 }}>{lives}</span></span>
        {chip('💰', gold, 'var(--gold)')}
      </div>
      <div className="row gap2" style={{ alignItems: 'center' }}>
        {combo > 1 && (() => {
          const tier = combo >= 20 ? { c: 'var(--bubble-mid)', l: 'UNREAL' } : combo >= 12 ? { c: 'var(--luna-mid)', l: 'INSANE' } : combo >= 7 ? { c: 'var(--sugar-mid)', l: 'ON FIRE' } : combo >= 4 ? { c: 'var(--blossom-mid)', l: 'COMBO' } : { c: 'var(--gold)', l: 'COMBO' };
          const size = Math.min(25, 14 + combo * 0.5);
          return <span key={combo} className="num combo" style={{ color: tier.c, fontSize: size, textShadow: `0 0 12px ${tier.c}` }}>×{combo} {tier.l}</span>;
        })()}
        {chip('🌊', waveLabel, 'var(--storm-mid)')}{chip('⭐', score.toLocaleString(), 'var(--bubble-mid)')}
        <button onClick={onSpeed} title="Game speed" aria-label="Game speed" style={{ minWidth: 38, height: 38, padding: '0 10px', borderRadius: 99, flex: '0 0 auto', display: 'grid', placeItems: 'center', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: speed > 1 ? '#1a0f2e' : 'var(--text-soft)', background: speed > 1 ? 'linear-gradient(180deg,var(--bubble-mid),var(--bubble-dark))' : 'rgba(20,12,38,.66)', border: '1px solid var(--bg-line)' }}>{speed}×</button>
        <button onClick={onPause} title="Pause" aria-label="Pause" style={{ width: 38, height: 38, borderRadius: 99, flex: '0 0 auto', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: 15, color: 'var(--text-soft)', background: 'rgba(20,12,38,.66)', border: '1px solid var(--bg-line)' }}>⏸</button>
      </div>
    </div>
  );
}

// ---------- DOCK ----------
function AbilBtn({ icon, label, cd, cdMax, live, onClick }) {
  const ready = live && cd <= 0; const pct = cd > 0 ? cd / cdMax : 0;
  return (
    <button onClick={onClick} disabled={!ready} title={label} style={{ position: 'relative', flex: '0 0 auto', width: 50, alignSelf: 'stretch', minHeight: 48, borderRadius: 14, border: `1.5px solid ${ready ? 'var(--luna-mid)' : 'var(--bg-line)'}`, background: ready ? 'var(--bg-elevated)' : 'var(--bg-abyss)', cursor: ready ? 'pointer' : 'default', overflow: 'hidden', display: 'grid', placeItems: 'center', fontSize: 21, opacity: ready ? 1 : 0.55, boxShadow: ready ? '0 0 12px -3px var(--luna-mid)' : 'none' }}>
      <span style={{ position: 'relative', zIndex: 1 }}>{icon}</span>
      {cd > 0 && <div style={{ position: 'absolute', inset: 0, background: `conic-gradient(rgba(8,5,18,.74) ${pct * 360}deg, transparent 0)` }} />}
      {cd > 0 && <span className="num" style={{ position: 'absolute', zIndex: 2, fontSize: 13, color: '#fff', fontWeight: 800, textShadow: '0 1px 2px #000' }}>{Math.ceil(cd / 1000)}</span>}
    </button>
  );
}
function Dock({ sel, setSel, gold, status, onStart, enemiesLeft, keys, abil, onNova, onFreeze }) {
  return (
    <div className="dock">
      <div className="picker">
        {(keys || Object.keys(TOWERS)).map(k => {
          const tw = TOWERS[k]; const afford = gold >= tw.cost; const active = sel === k;
          return (
            <button key={k} onClick={() => setSel(k)} className="pick" style={{
              position: 'relative',
              borderColor: active ? `var(--${tw.family}-mid)` : 'var(--bg-line)',
              background: active ? 'var(--bg-elevated)' : 'var(--bg-panel)',
              boxShadow: active ? `0 0 14px -3px var(--${tw.family}-mid)` : 'none',
              transform: active ? 'translateY(-4px)' : 'none', opacity: afford ? 1 : 0.5,
              ...(window.BBShop && window.BBShop.skinVars ? window.BBShop.skinVars(tw.family) : {}),
            }}>
              <div className="pick-art"><TowerGlyph type={k} level={1} /></div>
              {['luna', 'storm', 'hive'].includes(k) && <div title="Hits flying" style={{ position: 'absolute', top: 3, right: 4, fontSize: 9 }}>✈️</div>}
              <div className="num" style={{ fontSize: 11, color: afford ? 'var(--gold)' : 'var(--danger)' }}>💰{tw.cost}</div>
            </button>
          );
        })}
      </div>
      <div className="row gap2" style={{ flex: '0 0 auto', alignItems: 'stretch' }}>
        <AbilBtn icon="💥" label="Bloom Nova — damage all" cd={abil ? abil.nova : 0} cdMax={12000} live={status === 'running'} onClick={onNova} />
        <AbilBtn icon="❄️" label="Deep Freeze — slow all" cd={abil ? abil.freeze : 0} cdMax={16000} live={status === 'running'} onClick={onFreeze} />
      </div>
      <button className="next-btn" onClick={onStart} disabled={status === 'running'} style={{ opacity: status === 'running' ? .85 : 1 }}>
        {status === 'running' ? `👾 ${enemiesLeft} left` : status === 'ready' ? '▶ START WAVE' : '▶ NEXT'}
      </button>
    </div>
  );
}

// ---------- END OVERLAY ----------
function EndOverlay({ status, score, onRestart }) {
  const won = status === 'won';
  return (
    <div className="end-ov">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 20, whiteSpace: 'nowrap' }}>
        <div style={{ fontSize: 46, lineHeight: 1 }}>{won ? '🏆' : '💀'}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: 1.1, whiteSpace: 'nowrap', color: won ? 'var(--success)' : 'var(--danger)', textShadow: `0 0 20px ${won ? 'var(--success)' : 'var(--danger)'}` }}>{won ? 'WAVE CLEARED!' : 'BASTION FELL'}</div>
        <div className="num" style={{ color: 'var(--text-soft)', fontSize: 16, whiteSpace: 'nowrap' }}>Score {score.toLocaleString()}</div>
        <button className="next-btn" style={{ marginTop: 6 }} onClick={onRestart}>↻ Play again</button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('game')).render(<Game />);
