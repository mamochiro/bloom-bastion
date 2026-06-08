/* global React */
// ============================================================
// BLOOM BASTION — Map Tiles & Props (isometric, flat vector)
// Diamond tile, viewBox 0 0 100 84. Top face + 12px depth.
// ============================================================

function IsoTile({ top, left, right, children, glow }) {
  // top face diamond points
  const T = "50,4 96,30 50,56 4,30";
  return (
    <svg viewBox="0 0 100 84" width="100%" height="100%" style={{ overflow: 'visible' }}>
      {glow && <polygon points={T} fill={glow} opacity="0.0" />}
      {/* depth sides */}
      <path d="M4 30 L50 56 L50 72 L4 46 Z" fill={left} />
      <path d="M96 30 L50 56 L50 72 L96 46 Z" fill={right} />
      {/* top face */}
      <polygon points={T} fill={top} />
      {children}
    </svg>
  );
}

const TileGrass = () => (
  <IsoTile top="#5fbf52" left="#3f8a38" right="#327a2e">
    <circle cx="38" cy="26" r="2" fill="#7fe070" />
    <circle cx="60" cy="34" r="2" fill="#7fe070" />
    <circle cx="52" cy="20" r="1.6" fill="#7fe070" />
    <path d="M44 30 q2 -5 4 0" stroke="#3f8a38" strokeWidth="1.4" fill="none" />
    <path d="M58 24 q2 -5 4 0" stroke="#3f8a38" strokeWidth="1.4" fill="none" />
  </IsoTile>
);

const TilePath = () => (
  <IsoTile top="#cBA978" left="#9c7c4f" right="#8a6c43">
    <ellipse cx="42" cy="28" rx="6" ry="3.2" fill="#b89863" />
    <ellipse cx="60" cy="34" rx="5" ry="2.6" fill="#b89863" />
    <ellipse cx="55" cy="22" rx="3" ry="1.6" fill="#dcc093" />
    <circle cx="48" cy="36" r="1.4" fill="#8a6c43" />
  </IsoTile>
);

const TileWater = () => (
  <IsoTile top="var(--storm-mid)" left="var(--storm-dark)" right="#1f5a8e" glow="var(--storm-light)">
    <path d="M28 28 q6 -4 12 0 t12 0" stroke="var(--storm-light)" strokeWidth="2" fill="none" opacity="0.8"
      style={{ animation: 'bob-sm 2.4s ease-in-out infinite' }} />
    <path d="M40 38 q6 -4 12 0 t12 0" stroke="#fff" strokeWidth="1.6" fill="none" opacity="0.5"
      style={{ animation: 'bob-sm 3s ease-in-out infinite' }} />
    <circle cx="58" cy="24" r="2" fill="#fff" opacity="0.6" />
  </IsoTile>
);

const TileLava = () => (
  <IsoTile top="#ff6b3d" left="#b8341a" right="#9c2410" glow="var(--gold)">
    <path d="M30 30 q8 -6 16 0 t16 2" stroke="var(--gold)" strokeWidth="2.4" fill="none"
      style={{ animation: 'pulse-glow 2s ease-in-out infinite', transformOrigin: '50px 30px' }} />
    <circle cx="42" cy="26" r="3" fill="#ffd34d" style={{ animation: 'pulse-glow 1.6s ease-in-out infinite', transformOrigin: '42px 26px' }} />
    <circle cx="60" cy="36" r="2.4" fill="#ffe88a" />
    <circle cx="52" cy="40" r="1.6" fill="#fff" opacity="0.8" />
  </IsoTile>
);

const TileCrystal = () => (
  <IsoTile top="#3a2563" left="#2a1652" right="#21103f" glow="var(--luna-mid)">
    <g filter="drop-shadow(0 0 5px var(--luna-mid))">
      <path d="M46 14 L54 26 L50 40 L42 30 Z" fill="var(--luna-mid)" />
      <path d="M46 14 L54 26 L48 24 Z" fill="var(--luna-light)" />
      <path d="M60 24 L66 32 L62 42 L56 34 Z" fill="var(--luna-light)" opacity="0.8" />
    </g>
    <circle cx="38" cy="36" r="1.6" fill="var(--luna-light)" style={{ animation: 'pulse-glow 2.2s ease-in-out infinite', transformOrigin: '38px 36px' }} />
  </IsoTile>
);

// ---------- PROPS (top-down little decorations) ----------
const PropFlower = () => (
  <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <g style={{ animation: 'bob-sm 3s ease-in-out infinite', transformOrigin: '30px 30px' }}>
      <line x1="30" y1="34" x2="30" y2="50" stroke="#3f8a38" strokeWidth="3" strokeLinecap="round" />
      {[0,1,2,3,4].map(i => {
        const a = (i/5)*Math.PI*2 - Math.PI/2;
        return <ellipse key={i} cx={30+Math.cos(a)*8} cy={26+Math.sin(a)*8} rx="5" ry="7"
          fill={i%2?'var(--blossom-mid)':'var(--blossom-light)'} transform={`rotate(${a*180/Math.PI+90} ${30+Math.cos(a)*8} ${26+Math.sin(a)*8})`} />;
      })}
      <circle cx="30" cy="26" r="4" fill="var(--gold)" />
    </g>
  </svg>
);

const PropMushroom = () => (
  <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <ellipse cx="30" cy="52" rx="11" ry="3" fill="#000" opacity="0.2" />
    <rect x="25" y="32" width="10" height="18" rx="5" fill="#fbeede" />
    <path d="M12 34 Q12 16 30 16 Q48 16 48 34 Z" fill="var(--sugar-mid)" />
    <circle cx="22" cy="26" r="3" fill="#fff" />
    <circle cx="36" cy="24" r="2.4" fill="#fff" />
    <circle cx="32" cy="31" r="2" fill="#fff" />
  </svg>
);

const PropTree = () => (
  <svg viewBox="0 0 60 60" width="100%" height="100%" style={{ overflow: 'visible' }}>
    <ellipse cx="30" cy="54" rx="12" ry="3" fill="#000" opacity="0.2" />
    <rect x="26" y="38" width="8" height="16" rx="3" fill="#8a5a32" />
    <g style={{ animation: 'bob-sm 3.4s ease-in-out infinite', transformOrigin: '30px 26px' }}>
      <circle cx="22" cy="30" r="11" fill="#4ea846" />
      <circle cx="38" cy="30" r="11" fill="#4ea846" />
      <circle cx="30" cy="20" r="13" fill="#5fbf52" />
      <circle cx="26" cy="24" r="3" fill="#7fe070" />
      <circle cx="34" cy="22" r="2.4" fill="var(--blossom-light)" />
    </g>
  </svg>
);

const TILES = {
  grass:   { name: 'Grass', comp: TileGrass, use: 'Buildable terrain. Towers place here.' },
  path:    { name: 'Path (dirt)', comp: TilePath, use: 'Enemy lane. Non-buildable.' },
  water:   { name: 'Water', comp: TileWater, use: 'Blocks placement. Bubbler gets a bonus nearby.' },
  lava:    { name: 'Lava', comp: TileLava, use: 'Hazard tile. Burns enemies that cross slow lanes.' },
  crystal: { name: 'Crystal', comp: TileCrystal, use: 'Rare terrain. Luna towers gain range here.' },
};
const PROPS = {
  flower:   { name: 'Flowers', comp: PropFlower },
  mushroom: { name: 'Mushroom', comp: PropMushroom },
  tree:     { name: 'Tiny Tree', comp: PropTree },
};

Object.assign(window, { IsoTile, TileGrass, TilePath, TileWater, TileLava, TileCrystal, PropFlower, PropMushroom, PropTree, TILES, PROPS });
