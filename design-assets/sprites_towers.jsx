/* global React */
// ============================================================
// BLOOM BASTION — Tower Sprites
// Flat vector + glow. Each tower renders levels 1–3 with clear
// progression in size, decoration, and glow intensity.
// viewBox 0 0 120 150, grounded at bottom.
// ============================================================
const { useId } = React;

// Small helper: a glowing core orb (the shared "deadly" tell)
function Core({ cx, cy, r, color }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r * 2.1} fill={color} opacity="0.18"
        style={{ animation: 'pulse-glow 2.4s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` }} />
      <circle cx={cx} cy={cy} r={r} fill="#fff" />
      <circle cx={cx} cy={cy} r={r} fill={color} opacity="0.55" />
      <circle cx={cx - r*0.3} cy={cy - r*0.3} r={r*0.32} fill="#fff" opacity="0.9" />
    </g>
  );
}

// Reusable hex pedestal that all towers sit on
function Pedestal({ light, dark }) {
  return (
    <g>
      <ellipse cx="60" cy="140" rx="34" ry="9" fill="#000" opacity="0.28" />
      <path d="M30 132 L60 122 L90 132 L90 138 L60 148 L30 138 Z" fill={dark} />
      <path d="M30 132 L60 122 L90 132 L60 142 Z" fill={light} />
      <path d="M30 132 L60 142 L60 148 L30 138 Z" fill={dark} opacity="0.7" />
    </g>
  );
}

// ---------- 🌸 BLOSSOM ----------
function TowerBlossom({ level = 2 }) {
  const petals = (cx, cy, scale, color, lightC) => {
    const arr = [];
    const n = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      const px = cx + Math.cos(a) * 13 * scale;
      const py = cy + Math.sin(a) * 13 * scale;
      arr.push(
        <g key={i} transform={`rotate(${(a * 180) / Math.PI + 90} ${px} ${py})`}>
          <ellipse cx={px} cy={py} rx={9 * scale} ry={12 * scale} fill={color} />
          <ellipse cx={px} cy={py - 3 * scale} rx={4.5 * scale} ry={6 * scale} fill={lightC} opacity="0.7" />
        </g>
      );
    }
    return arr;
  };
  const glow = level === 3 ? 14 : level === 2 ? 9 : 6;
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Pedestal light="var(--blossom-mid)" dark="var(--blossom-dark)" />
      {/* falling petals */}
      {Array.from({ length: level + 1 }).map((_, i) => (
        <ellipse key={i} cx={48 + i * 14} cy={70} rx="3.5" ry="5" fill="var(--blossom-light)"
          style={{ '--dx': `${i % 2 ? 14 : -12}px`, animation: `petal-fall ${2.6 + i * 0.4}s ease-in ${i * 0.5}s infinite`, transformOrigin: 'center' }} />
      ))}
      <g style={{ animation: 'bob 3s ease-in-out infinite', transformOrigin: '60px 80px' }}
         filter={`drop-shadow(0 0 ${glow}px var(--blossom-mid))`}>
        {/* stem */}
        <rect x="56" y="92" width="8" height="34" rx="4" fill="var(--blossom-dark)" />
        {level >= 2 && <ellipse cx="48" cy="104" rx="8" ry="4" fill="var(--blossom-dark)" transform="rotate(-30 48 104)" />}
        {level >= 2 && <ellipse cx="72" cy="110" rx="8" ry="4" fill="var(--blossom-dark)" transform="rotate(30 72 110)" />}
        {/* side buds (L2+) */}
        {level >= 2 && petals(40, 70, 0.5, 'var(--blossom-light)', '#fff')}
        {level >= 2 && petals(82, 66, 0.5, 'var(--blossom-light)', '#fff')}
        {/* crown blossoms (L3) */}
        {level >= 3 && petals(40, 50, 0.62, 'var(--blossom-mid)', 'var(--blossom-light)')}
        {level >= 3 && petals(80, 50, 0.62, 'var(--blossom-mid)', 'var(--blossom-light)')}
        {/* main blossom */}
        {petals(60, 62, level >= 3 ? 1.15 : level === 2 ? 0.95 : 0.78, 'var(--blossom-mid)', 'var(--blossom-light)')}
        <Core cx={60} cy={62} r={level >= 3 ? 8 : 6} color="var(--gold)" />
      </g>
    </svg>
  );
}

// ---------- ⚡ STORMCLOUD ----------
function TowerStorm({ level = 2 }) {
  const cloud = (cx, cy, s, fill) => (
    <g>
      <circle cx={cx - 14 * s} cy={cy + 2} r={11 * s} fill={fill} />
      <circle cx={cx + 14 * s} cy={cy + 2} r={11 * s} fill={fill} />
      <circle cx={cx - 4 * s} cy={cy - 7 * s} r={13 * s} fill={fill} />
      <circle cx={cx + 7 * s} cy={cy - 5 * s} r={11 * s} fill={fill} />
      <rect x={cx - 24 * s} y={cy} width={48 * s} height={11 * s} rx={6 * s} fill={fill} />
    </g>
  );
  const cloudFill = level >= 3 ? 'var(--storm-dark)' : 'var(--storm-light)';
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Pedestal light="var(--storm-mid)" dark="var(--storm-dark)" />
      <g style={{ animation: 'bob 3.4s ease-in-out infinite', transformOrigin: '60px 60px' }}>
        {/* lightning bolts */}
        <g filter="drop-shadow(0 0 8px var(--gold))" style={{ animation: 'flicker 2.2s steps(1) infinite' }}>
          <path d="M58 78 L50 102 L60 100 L52 122 L74 92 L63 94 L70 78 Z" fill="var(--gold)" stroke="#fff7d6" strokeWidth="1.2" />
          {level >= 2 && <path d="M40 80 L35 96 L42 95 L37 110 L50 88 L43 89 L47 80 Z" fill="var(--gold)" opacity="0.85" />}
          {level >= 3 && <path d="M82 80 L77 96 L84 95 L79 110 L92 88 L85 89 L89 80 Z" fill="var(--gold)" opacity="0.85" />}
        </g>
        {/* rain dots L3 */}
        {level >= 3 && [0,1,2].map(i => (
          <circle key={i} cx={42 + i*18} cy={86} r="2.4" fill="var(--storm-light)"
            style={{ animation: `rise ${1.4}s linear ${i*0.3}s infinite`, animationDirection: 'reverse' }} />
        ))}
        {/* clouds */}
        {level >= 2 && cloud(44, 58, 0.6, 'var(--storm-light)')}
        {level >= 2 && cloud(80, 54, 0.55, 'var(--storm-light)')}
        <g filter={`drop-shadow(0 0 ${level>=3?12:7}px var(--storm-mid))`}>
          {cloud(60, 56, level >= 3 ? 1.05 : 0.85, cloudFill)}
        </g>
        <Core cx={60} cy={58} r={level >= 3 ? 6 : 5} color="#fff" />
      </g>
    </svg>
  );
}

// ---------- 🍭 SUGAR CANNON ----------
function TowerSugar({ level = 2 }) {
  const uid = useId().replace(/:/g, '');
  const s = level >= 3 ? 1.15 : level === 2 ? 1 : 0.82;
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={`swirl${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor="var(--sugar-light)" />
          <stop offset="100%" stopColor="var(--sugar-mid)" />
        </radialGradient>
      </defs>
      <Pedestal light="var(--sugar-mid)" dark="var(--sugar-dark)" />
      <g style={{ animation: 'bob-sm 2.8s ease-in-out infinite', transformOrigin: '60px 80px' }}>
        {/* cannon barrel */}
        <rect x="46" y="86" width="28" height="40" rx="13" fill="var(--sugar-dark)" />
        <rect x="50" y="86" width="8" height="40" rx="4" fill="var(--sugar-mid)" opacity="0.6" />
        {/* lollipop disc */}
        <g transform="translate(60 62)" filter={`drop-shadow(0 0 ${level>=3?13:8}px var(--sugar-mid))`}>
          <circle r={24 * s} fill={`url(#swirl${uid})`} />
          <path d={`M0 0 ${spiral(22 * s)}`} fill="none" stroke="var(--sugar-dark)" strokeWidth={3.2 * s} strokeLinecap="round"
            style={{ animation: 'spin-slow 9s linear infinite', transformOrigin: '0 0' }} />
          <circle r={24 * s} fill="none" stroke="#fff" strokeWidth="2" opacity="0.7" />
          {level >= 3 && <circle r={24 * s + 5} fill="none" stroke="var(--sugar-light)" strokeWidth="2.5" strokeDasharray="3 6" />}
        </g>
        {/* candy stripes / extra barrel L3 */}
        {level >= 3 && (
          <g transform="translate(36 58)" filter="drop-shadow(0 0 6px var(--sugar-mid))">
            <circle r="11" fill={`url(#swirl${uid})`} />
            <circle r="11" fill="none" stroke="var(--sugar-dark)" strokeWidth="2" />
          </g>
        )}
      </g>
    </svg>
  );
}
function spiral(R) {
  // produce a small archimedean spiral path string
  let d = '';
  for (let t = 0; t <= 6.2; t += 0.4) {
    const r = (R / 6.2) * t;
    const x = Math.cos(t) * r, y = Math.sin(t) * r;
    d += `${t === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  return d;
}

// ---------- 🌙 LUNA CRYSTAL ----------
function TowerLuna({ level = 2 }) {
  const s = level >= 3 ? 1.18 : level === 2 ? 1 : 0.82;
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Pedestal light="var(--luna-mid)" dark="var(--luna-dark)" />
      {/* moonbeam */}
      <path d="M52 64 L48 138 L72 138 L68 64 Z" fill="var(--luna-light)" opacity="0.16"
        style={{ animation: 'pulse-glow 3s ease-in-out infinite', transformOrigin: '60px 100px' }} />
      <g style={{ animation: 'bob 3.6s ease-in-out infinite', transformOrigin: '60px 64px' }}
         filter={`drop-shadow(0 0 ${level>=3?14:9}px var(--luna-mid))`}>
        {/* crescent accent L2+ */}
        {level >= 2 && (
          <g transform={`translate(${level>=3?34:38} 44)`}>
            <circle r="9" fill="var(--luna-light)" />
            <circle cx="4" r="8" fill="var(--bg-stage)" />
          </g>
        )}
        {/* faceted crystal */}
        <g transform="translate(60 64)">
          <path d={`M0 ${-34*s} L${16*s} ${-8*s} L${10*s} ${30*s} L${-10*s} ${30*s} L${-16*s} ${-8*s} Z`} fill="var(--luna-mid)" />
          <path d={`M0 ${-34*s} L${16*s} ${-8*s} L0 ${-4*s} Z`} fill="var(--luna-light)" />
          <path d={`M0 ${-34*s} L${-16*s} ${-8*s} L0 ${-4*s} Z`} fill="var(--luna-dark)" opacity="0.85" />
          <path d={`M0 ${-4*s} L${16*s} ${-8*s} L${10*s} ${30*s} Z`} fill="var(--luna-light)" opacity="0.55" />
          <path d={`M0 ${-4*s} L${-16*s} ${-8*s} L${-10*s} ${30*s} Z`} fill="var(--luna-dark)" opacity="0.6" />
          {level >= 3 && <path d={`M0 ${-4*s} L${10*s} ${30*s} L${-10*s} ${30*s} Z`} fill="var(--luna-light)" opacity="0.3" />}
        </g>
        <Core cx={60} cy={62} r={level >= 3 ? 6 : 4.5} color="var(--luna-light)" />
      </g>
    </svg>
  );
}

// ---------- 🐝 HIVE ----------
function TowerHive({ level = 2 }) {
  const hex = (cx, cy, r, fill) => {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      pts.push(`${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`);
    }
    return <polygon points={pts.join(' ')} fill={fill} />;
  };
  const rows = level >= 3 ? 4 : level === 2 ? 3 : 2;
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Pedestal light="var(--hive-mid)" dark="var(--hive-dark)" />
      {/* orbiting bees */}
      {Array.from({ length: rows }).map((_, i) => (
        <g key={i} style={{ animation: `orbit ${3 + i*0.6}s linear ${i*0.4}s infinite`, transformOrigin: '60px 70px' }}>
          <g transform="translate(60 70)">
            <ellipse cx="0" cy="0" rx="4" ry="3" fill="var(--gold)" />
            <rect x="-1.5" y="-3" width="1.4" height="6" fill="var(--bg-deep)" />
            <ellipse cx="-3" cy="-2" rx="3" ry="1.6" fill="#fff" opacity="0.8" style={{ animation: 'flutter .3s ease-in-out infinite' }} />
          </g>
        </g>
      ))}
      <g style={{ animation: 'bob-sm 3s ease-in-out infinite', transformOrigin: '60px 90px' }}
         filter={`drop-shadow(0 0 ${level>=3?12:7}px var(--hive-mid))`}>
        {Array.from({ length: rows }).map((_, i) => {
          const y = 116 - i * 18;
          const r = 22 - i * 3.2;
          return (
            <g key={i}>
              {hex(60, y, r, i % 2 ? 'var(--hive-mid)' : 'var(--hive-light)')}
              {hex(60, y, r * 0.55, 'var(--hive-dark)')}
            </g>
          );
        })}
        {/* honey drip L3 */}
        {level >= 3 && <path d="M60 124 q-3 8 0 14 q3 -6 0 -14" fill="var(--gold)" />}
      </g>
    </svg>
  );
}

// ---------- 🌊 BUBBLER ----------
function TowerBubble({ level = 2 }) {
  const tiers = level >= 3 ? 3 : level === 2 ? 2 : 1;
  return (
    <svg viewBox="0 0 120 150" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <Pedestal light="var(--bubble-mid)" dark="var(--bubble-dark)" />
      {/* rising bubbles */}
      {Array.from({ length: tiers + 2 }).map((_, i) => (
        <circle key={i} cx={46 + (i % 4) * 9} cy={96} r={2 + (i % 3)} fill="var(--bubble-light)" opacity="0.8"
          style={{ animation: `rise ${2 + (i % 3) * 0.6}s ease-in ${i * 0.4}s infinite` }} />
      ))}
      <g style={{ animation: 'bob-sm 3.2s ease-in-out infinite', transformOrigin: '60px 100px' }}
         filter={`drop-shadow(0 0 ${level>=3?12:7}px var(--bubble-mid))`}>
        {/* fountain bowls (tiered) */}
        {Array.from({ length: tiers }).map((_, i) => {
          const y = 122 - i * 20;
          const w = 30 - i * 7;
          return (
            <g key={i}>
              <path d={`M${60-w} ${y} Q60 ${y+12} ${60+w} ${y} Q60 ${y+5} ${60-w} ${y}`} fill="var(--bubble-dark)" />
              <ellipse cx="60" cy={y} rx={w} ry="5" fill="var(--bubble-mid)" />
              <ellipse cx="60" cy={y} rx={w*0.7} ry="3" fill="var(--bubble-light)" opacity="0.7" />
            </g>
          );
        })}
        {/* spout column */}
        <rect x="57" y="62" width="6" height={tiers >= 2 ? 44 : 24} rx="3" fill="var(--bubble-mid)" opacity="0.5" />
        {/* top bubble cluster */}
        <circle cx="60" cy="60" r={level >= 3 ? 15 : 11} fill="var(--bubble-mid)" opacity="0.5" />
        <circle cx="54" cy="64" r="6" fill="var(--bubble-light)" opacity="0.75" />
        <Core cx={62} cy={56} r={level >= 3 ? 6 : 4.5} color="#fff" />
      </g>
    </svg>
  );
}

const TOWERS = {
  blossom: { name: 'Blossom', emoji: '🌸', comp: TowerBlossom, family: 'blossom', role: 'Single-target DPS', desc: 'Cherry-blossom turret that fires homing petals. Fast attack, trailing petal FX.', token: '--blossom-mid', cost: 120, range: 'Med' },
  storm:   { name: 'Stormcloud', emoji: '⚡', comp: TowerStorm, family: 'storm', role: 'Chain lightning', desc: 'Drifting cloud that arcs lightning between grouped enemies. Loves a crowd.', token: '--storm-mid', cost: 150, range: 'Med' },
  sugar:   { name: 'Sugar Cannon', emoji: '🍭', comp: TowerSugar, family: 'sugar', role: 'Splash / AoE', desc: 'Lollipop mortar lobbing sticky candy. Slows on impact, splash damage.', token: '--sugar-mid', cost: 200, range: 'Low' },
  luna:    { name: 'Luna Crystal', emoji: '🌙', comp: TowerLuna, family: 'luna', role: 'Pierce beam', desc: 'Faceted crystal channeling a moonbeam that pierces in a straight line.', token: '--luna-mid', cost: 180, range: 'High' },
  hive:    { name: 'Hive', emoji: '🐝', comp: TowerHive, family: 'hive', role: 'Swarm / DoT', desc: 'Releases bees that chase and apply stacking damage-over-time.', token: '--hive-mid', cost: 160, range: 'Med' },
  bubble:  { name: 'Bubbler', emoji: '🌊', comp: TowerBubble, family: 'bubble', role: 'Crowd control', desc: 'Traps enemies in bubbles, floating them back along the path. Pure tempo.', token: '--bubble-mid', cost: 140, range: 'Med' },
};

Object.assign(window, { TowerBlossom, TowerStorm, TowerSugar, TowerLuna, TowerHive, TowerBubble, TOWERS, Core, Pedestal });
