/* global React */
// ============================================================
// BLOOM BASTION — Enemy Sprites
// Flat vector + glow. The "deadly" half of cute-but-deadly.
// viewBox 0 0 100 100, grounded near bottom.
// Each exposes idle/walk motion via CSS; hit-flash + death are
// demonstrated in the FX tab via overlay/scale.
// ============================================================

// ---------- 🐛 GRUB ----------
function EnemyGrub() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="86" rx="26" ry="6" fill="#000" opacity="0.25" />
      <g style={{ animation: 'walk-waddle 0.7s ease-in-out infinite', transformOrigin: '50px 70px' }}>
        {[0,1,2].map(i => (
          <circle key={i} cx={36 + i*15} cy={70 - (i===1?4:0)} r={13 - i*1.5} fill={i%2 ? '#7be86b' : '#9cf28a'} />
        ))}
        <circle cx="36" cy="70" r="11.5" fill="#caffb8" opacity="0.5" />
        {/* face */}
        <circle cx="32" cy="67" r="2.6" fill="#1a0f2e" />
        <circle cx="40" cy="67" r="2.6" fill="#1a0f2e" />
        <circle cx="31.2" cy="66.2" r="0.9" fill="#fff" />
        <circle cx="39.2" cy="66.2" r="0.9" fill="#fff" />
        <path d="M30 74 Q36 78 42 74" stroke="#1a0f2e" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        {/* antennae */}
        <line x1="32" y1="60" x2="29" y2="53" stroke="#5bbf4f" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="40" y1="60" x2="43" y2="53" stroke="#5bbf4f" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="29" cy="52" r="1.8" fill="var(--blossom-mid)" />
        <circle cx="43" cy="52" r="1.8" fill="var(--blossom-mid)" />
      </g>
    </svg>
  );
}

// ---------- 🐌 SNAIL ----------
function EnemySnail() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="52" cy="84" rx="32" ry="6" fill="#000" opacity="0.25" />
      <g style={{ animation: 'bob-sm 2.4s ease-in-out infinite', transformOrigin: '50px 70px' }}>
        {/* body / foot */}
        <path d="M18 80 Q22 64 44 64 L72 64 Q84 64 84 74 Q84 82 72 82 L26 82 Q18 82 18 80" fill="#b6e0ff" />
        {/* head */}
        <circle cx="26" cy="66" r="9" fill="#cfeeff" />
        <line x1="22" y1="60" x2="19" y2="50" stroke="#9bcdf0" strokeWidth="2" strokeLinecap="round" />
        <line x1="29" y1="59" x2="31" y2="49" stroke="#9bcdf0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="49" r="2.4" fill="#1a0f2e" />
        <circle cx="31" cy="48" r="2.4" fill="#1a0f2e" />
        <circle cx="24" cy="67" r="1.8" fill="#1a0f2e" />
        {/* shell */}
        <circle cx="58" cy="58" r="22" fill="var(--storm-mid)" />
        <circle cx="58" cy="58" r="22" fill="none" stroke="var(--storm-dark)" strokeWidth="2.5" />
        <path d="M58 58 m0 0 a6 6 0 1 1 9 4 a12 12 0 1 1 -18 -8 a18 18 0 1 1 28 14"
          fill="none" stroke="var(--storm-light)" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------- 🦋 FLUTTER (flying) ----------
function EnemyFlutter() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="90" rx="14" ry="4" fill="#000" opacity="0.18" />
      <g style={{ animation: 'bob 1.6s ease-in-out infinite', transformOrigin: '50px 50px' }}>
        {/* wings */}
        <g style={{ animation: 'flutter 0.32s ease-in-out infinite', transformOrigin: '50px 50px' }}>
          <ellipse cx="34" cy="42" rx="15" ry="18" fill="var(--blossom-mid)" />
          <ellipse cx="36" cy="62" rx="11" ry="13" fill="var(--luna-mid)" />
          <ellipse cx="66" cy="42" rx="15" ry="18" fill="var(--blossom-mid)" />
          <ellipse cx="64" cy="62" rx="11" ry="13" fill="var(--luna-mid)" />
          <circle cx="32" cy="40" r="4" fill="var(--gold)" />
          <circle cx="68" cy="40" r="4" fill="var(--gold)" />
        </g>
        {/* body */}
        <rect x="47" y="38" width="6" height="34" rx="3" fill="#3a2563" />
        <circle cx="50" cy="38" r="6" fill="#4a2f7a" />
        <circle cx="47" cy="36" r="1.6" fill="#fff" />
        <circle cx="53" cy="36" r="1.6" fill="#fff" />
        <line x1="48" y1="33" x2="45" y2="27" stroke="#4a2f7a" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="52" y1="33" x2="55" y2="27" stroke="#4a2f7a" strokeWidth="1.4" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------- 💀 SHADE ----------
function EnemyShade() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="88" rx="20" ry="5" fill="var(--shade-core)" opacity="0.25" />
      <g style={{ animation: 'bob 2.2s ease-in-out infinite', transformOrigin: '50px 55px' }}
         filter="drop-shadow(0 0 10px var(--shade-glow))">
        <path d="M30 60 Q30 28 50 28 Q70 28 70 60 L70 78 Q66 70 62 78 Q58 70 54 78 Q50 70 46 78 Q42 70 38 78 Q34 70 30 78 Z"
          fill="#2a1652" />
        <path d="M30 60 Q30 28 50 28 Q70 28 70 60 L70 70 Q50 64 30 70 Z" fill="var(--shade-core)" opacity="0.5" />
        {/* glowing eyes */}
        <ellipse cx="42" cy="52" rx="4" ry="5.5" fill="var(--shade-glow)" filter="drop-shadow(0 0 4px var(--shade-glow))" />
        <ellipse cx="58" cy="52" rx="4" ry="5.5" fill="var(--shade-glow)" filter="drop-shadow(0 0 4px var(--shade-glow))" />
        <ellipse cx="42" cy="53" rx="1.6" ry="2.4" fill="#fff" />
        <ellipse cx="58" cy="53" rx="1.6" ry="2.4" fill="#fff" />
      </g>
    </svg>
  );
}

// ---------- 🧸 PLUSHY (tank) ----------
function EnemyPlushy() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="90" rx="28" ry="6" fill="#000" opacity="0.28" />
      <g style={{ animation: 'walk-waddle 0.9s ease-in-out infinite', transformOrigin: '50px 60px' }}>
        {/* ears */}
        <circle cx="34" cy="34" r="10" fill="var(--hive-dark)" />
        <circle cx="66" cy="34" r="10" fill="var(--hive-dark)" />
        <circle cx="34" cy="34" r="5" fill="var(--hive-mid)" />
        <circle cx="66" cy="34" r="5" fill="var(--hive-mid)" />
        {/* legs */}
        <ellipse cx="40" cy="84" rx="9" ry="8" fill="var(--hive-dark)" />
        <ellipse cx="60" cy="84" rx="9" ry="8" fill="var(--hive-dark)" />
        {/* body */}
        <rect x="32" y="56" width="36" height="30" rx="16" fill="var(--hive-mid)" />
        {/* head */}
        <circle cx="50" cy="48" r="20" fill="var(--hive-mid)" />
        <circle cx="50" cy="54" r="9" fill="var(--hive-light)" />
        <ellipse cx="50" cy="52" rx="3" ry="2.4" fill="#5a3210" />
        {/* eyes — stitched X (deadly tell) */}
        <path d="M40 44 l5 5 M45 44 l-5 5" stroke="#3a2008" strokeWidth="2" strokeLinecap="round" />
        <path d="M55 44 l5 5 M60 44 l-5 5" stroke="#3a2008" strokeWidth="2" strokeLinecap="round" />
        {/* seam */}
        <line x1="50" y1="56" x2="50" y2="86" stroke="var(--hive-dark)" strokeWidth="1.5" strokeDasharray="2 3" opacity="0.6" />
      </g>
    </svg>
  );
}

// ---------- 🐙 SPLITTER ----------
function EnemySplitter() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="88" rx="26" ry="6" fill="#000" opacity="0.25" />
      <g style={{ animation: 'bob-sm 1.8s ease-in-out infinite', transformOrigin: '50px 55px' }}>
        {/* tentacles */}
        {[0,1,2,3,4].map(i => {
          const x = 30 + i * 10;
          return <path key={i} d={`M${x} 64 Q${x-3} 80 ${x+ (i%2?4:-4)} 86`} stroke="var(--success)" strokeWidth="6" fill="none" strokeLinecap="round"
            style={{ animation: `walk-waddle ${0.8+i*0.1}s ease-in-out infinite`, transformOrigin: `${x}px 64px` }} />;
        })}
        {/* head */}
        <circle cx="50" cy="48" r="24" fill="var(--success)" />
        <circle cx="50" cy="48" r="24" fill="var(--bubble-light)" opacity="0.25" />
        <ellipse cx="42" cy="44" rx="5" ry="6" fill="#fff" />
        <ellipse cx="58" cy="44" rx="5" ry="6" fill="#fff" />
        <circle cx="43" cy="45" r="2.6" fill="#0d3a26" />
        <circle cx="59" cy="45" r="2.6" fill="#0d3a26" />
        {/* split hint: dotted division line */}
        <line x1="50" y1="26" x2="50" y2="70" stroke="#0d3a26" strokeWidth="1.5" strokeDasharray="2 4" opacity="0.5" />
        <path d="M44 56 Q50 60 56 56" stroke="#0d3a26" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}

// ---------- 👑 CANDY KING (mini-boss) ----------
function EnemyCandyKing() {
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="92" rx="32" ry="7" fill="#000" opacity="0.3" />
      <g style={{ animation: 'bob 2.6s ease-in-out infinite', transformOrigin: '50px 60px' }}
         filter="drop-shadow(0 0 8px var(--sugar-mid))">
        {/* body — big gumdrop */}
        <path d="M24 86 Q22 44 50 40 Q78 44 76 86 Z" fill="var(--sugar-mid)" />
        <path d="M24 86 Q22 44 50 40 Q64 42 70 60 Q40 56 24 86" fill="var(--sugar-light)" opacity="0.4" />
        {/* candy dots */}
        <circle cx="40" cy="70" r="3" fill="#fff" opacity="0.7" />
        <circle cx="58" cy="76" r="3" fill="#fff" opacity="0.7" />
        <circle cx="50" cy="62" r="3" fill="#fff" opacity="0.7" />
        {/* face */}
        <ellipse cx="42" cy="58" rx="3.4" ry="4.4" fill="#3a0f1c" />
        <ellipse cx="58" cy="58" rx="3.4" ry="4.4" fill="#3a0f1c" />
        <circle cx="41" cy="57" r="1.2" fill="#fff" />
        <circle cx="57" cy="57" r="1.2" fill="#fff" />
        <path d="M42 66 Q50 72 58 66" stroke="#3a0f1c" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* crown */}
        <g filter="drop-shadow(0 0 6px var(--gold))">
          <path d="M30 40 L34 24 L42 34 L50 20 L58 34 L66 24 L70 40 Z" fill="var(--gold)" stroke="var(--gold-deep)" strokeWidth="1.5" />
          <circle cx="50" cy="22" r="3" fill="var(--blossom-mid)" />
          <circle cx="34" cy="26" r="2.4" fill="var(--bubble-mid)" />
          <circle cx="66" cy="26" r="2.4" fill="var(--bubble-mid)" />
          <rect x="30" y="38" width="40" height="5" rx="2" fill="var(--gold-deep)" />
        </g>
      </g>
    </svg>
  );
}

// ---------- 🐲 NEON DRAGON (final boss, 2 phases) ----------
function EnemyDragon({ phase = 1 }) {
  const c1 = phase === 2 ? 'var(--danger)' : 'var(--bubble-mid)';
  const c2 = phase === 2 ? '#ff85a0' : 'var(--luna-mid)';
  return (
    <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <ellipse cx="50" cy="92" rx="34" ry="7" fill="#000" opacity="0.3" />
      <g style={{ animation: 'bob 2.2s ease-in-out infinite', transformOrigin: '50px 52px' }}
         filter={`drop-shadow(0 0 12px ${c1})`}>
        {/* serpentine body */}
        <path d="M16 78 Q14 50 34 50 Q50 50 50 64 Q50 76 64 74 Q84 70 84 46"
          fill="none" stroke={c1} strokeWidth="11" strokeLinecap="round" />
        <path d="M16 78 Q14 50 34 50 Q50 50 50 64 Q50 76 64 74 Q84 70 84 46"
          fill="none" stroke={c2} strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        {/* spines */}
        {[0,1,2,3].map(i => (
          <path key={i} d={`M${30+i*16} ${48-i*0} l4 -8 l4 8`} fill={c2} opacity="0.85" />
        ))}
        {/* head */}
        <g transform="translate(84 44)">
          <path d="M-12 -8 Q6 -14 8 2 Q6 12 -8 10 Q-16 4 -12 -8" fill={c1} />
          <path d="M-6 -10 l2 -10 l5 8 Z" fill={c2} />
          <path d="M2 -10 l4 -9 l3 9 Z" fill={c2} />
          <circle cx="0" cy="-2" r="3.4" fill="#fff" />
          <circle cx="1" cy="-2" r="1.8" fill="#1a0f2e" />
          {/* nostril fire */}
          <circle cx="8" cy="4" r="2.5" fill="var(--gold)" style={{ animation: 'flicker 1.4s steps(1) infinite' }} />
        </g>
        {/* phase pip */}
        {phase === 2 && <circle cx="50" cy="20" r="3" fill="var(--danger)" style={{ animation: 'pulse-glow 1s ease-in-out infinite', transformOrigin: '50px 20px' }} />}
      </g>
    </svg>
  );
}

const ENEMIES = {
  grub:     { name: 'Grub', emoji: '🐛', comp: EnemyGrub, tier: 'Trash', hp: 'Low', speed: 'Slow', hpPct: 0.82, traits: 'First-wave fodder. Comes in swarms.' },
  snail:    { name: 'Snail', emoji: '🐌', comp: EnemySnail, tier: 'Trash', hp: 'Mid', speed: 'V. Slow', hpPct: 0.64, traits: 'Shell reduces frontal damage. Soak unit.' },
  flutter:  { name: 'Flutter', emoji: '🦋', comp: EnemyFlutter, tier: 'Flying', hp: 'Low', speed: 'Fast', hpPct: 0.45, traits: 'Airborne — only certain towers can hit it.' },
  shade:    { name: 'Shade', emoji: '💀', comp: EnemyShade, tier: 'Special', hp: 'Mid', speed: 'Mid', hpPct: 0.5, traits: 'Phases through the first tower it passes.' },
  plushy:   { name: 'Plushy', emoji: '🧸', comp: EnemyPlushy, tier: 'Tank', hp: 'High', speed: 'Slow', hpPct: 0.9, traits: 'Damage sponge. Stitched-X eyes = no mercy.' },
  splitter: { name: 'Splitter', emoji: '🐙', comp: EnemySplitter, tier: 'Special', hp: 'Mid', speed: 'Mid', hpPct: 0.55, traits: 'Splits into 2 smaller blobs on death.' },
  king:     { name: 'Candy King', emoji: '👑', comp: EnemyCandyKing, tier: 'Mini-boss', hp: 'V. High', speed: 'Slow', hpPct: 0.95, traits: 'Periodically heals nearby trash enemies.' },
  dragon:   { name: 'Neon Dragon', emoji: '🐲', comp: EnemyDragon, tier: 'Final boss', hp: 'Massive', speed: 'Variable', hpPct: 0.3, traits: 'Phase 1 mint → Phase 2 enraged red. Breathes fire.' },
};

Object.assign(window, { EnemyGrub, EnemySnail, EnemyFlutter, EnemyShade, EnemyPlushy, EnemySplitter, EnemyCandyKing, EnemyDragon, ENEMIES });
