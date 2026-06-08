/* global React, TOWERS, ENEMIES, TILES, PROPS, SectionHead */
// ============================================================
// TABS — Towers, Enemies, Map
// ============================================================
const { useState } = React;

function StageBox({ children, h = 200, pad = 14, style }) {
  return (
    <div style={{
      position: 'relative', height: h, borderRadius: 'var(--r-lg)', padding: pad,
      background: 'radial-gradient(120% 110% at 50% 0%, var(--bg-stage), var(--bg-abyss))',
      border: '1px solid var(--bg-line)', overflow: 'hidden',
      display: 'grid', placeItems: 'center', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, var(--bg-line) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: .2 }} />
      {children}
    </div>
  );
}

function FamilyDot({ family }) {
  return <span style={{ width: 12, height: 12, borderRadius: 99, background: `var(--${family}-mid)`, boxShadow: `0 0 8px var(--${family}-mid)`, display: 'inline-block' }} />;
}

// top-down targeting footprint: range ring grows with range tier + level
function RangeFootprint({ tower, level }) {
  const C = tower.comp;
  const base = { Low: 64, Med: 84, High: 104 }[tower.range] || 84;
  const radius = base + (level - 1) * 12;           // range grows ~12px per upgrade
  const inRange = (dx, dy) => Math.hypot(dx, dy) <= radius;
  // enemy dots scattered around the tower; highlight those inside the ring
  const dots = [
    [ -120, -34], [-70, 40], [-20, -70], [38, 60], [96, -20], [140, 30], [70, -56], [-150, 30],
  ];
  return (
    <div style={{ position: 'relative', height: 240, borderRadius: 'var(--r-md)', overflow: 'hidden',
      background: 'radial-gradient(130% 120% at 50% 30%, #2f7a36, #1b4d28)', border: '1px solid var(--bg-line)',
      display: 'grid', placeItems: 'center' }}>
      {/* grass grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.18) 1px, transparent 1px)', backgroundSize: '34px 34px', opacity: .5 }} />
      {/* range ring */}
      <div style={{ position: 'absolute', width: radius * 2, height: radius * 2, borderRadius: '50%',
        border: `2px dashed var(--${tower.family}-light)`,
        background: `radial-gradient(circle, color-mix(in oklch, var(--${tower.family}-mid) 26%, transparent), transparent 72%)`,
        boxShadow: `0 0 24px -6px var(--${tower.family}-mid)`,
        animation: 'spin-slow 22s linear infinite' }} />
      {/* enemy dots */}
      {dots.map(([dx, dy], i) => {
        const hit = inRange(dx, dy);
        return <div key={i} style={{ position: 'absolute', transform: `translate(${dx}px, ${dy}px)`,
          width: 16, height: 16, borderRadius: '50%',
          background: hit ? 'var(--danger)' : 'var(--bg-elevated)',
          border: `2px solid ${hit ? '#fff' : 'var(--bg-line)'}`,
          boxShadow: hit ? '0 0 10px var(--danger)' : 'none', opacity: hit ? 1 : .6 }} />;
      })}
      {/* tower */}
      <div style={{ position: 'relative', width: 96, zIndex: 2, filter: `drop-shadow(0 6px 10px rgba(0,0,0,.5))` }}><C level={level} /></div>
    </div>
  );
}

// ---------- TOWERS ----------
function TabTowers() {
  const keys = Object.keys(TOWERS);
  const [sel, setSel] = useState('blossom');
  const [lvl, setLvl] = useState(2);
  const t = TOWERS[sel];
  const C = t.comp;
  return (
    <div className="section">
      <SectionHead eyebrow="Tower Sprites · 6 × 3" title="Six families, three levels each"
        lead="Every tower shares the grammar: a hex pedestal, a glowing core, and an idle bob. Upgrades read at a glance — bigger silhouette, more decoration, brighter glow. Pick a tower and scrub its levels." />

      {/* family picker */}
      <div className="row wrap gap2" style={{ marginBottom: 18 }}>
        {keys.map(k => (
          <button key={k} onClick={() => setSel(k)} className="tab" style={{
            background: sel === k ? 'var(--bg-elevated)' : 'var(--bg-panel)',
            color: sel === k ? 'var(--text-bright)' : 'var(--text-dim)',
            border: sel === k ? `1px solid var(--${TOWERS[k].family}-mid)` : '1px solid var(--bg-line)',
          }}>
            <FamilyDot family={TOWERS[k].family} /> {TOWERS[k].emoji} {TOWERS[k].name}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,320px)', gap: 18 }} className="tower-grid">
        {/* big stage with level progression */}
        <div className="card" style={{ padding: 18 }}>
          <StageBox h={300}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, width: '100%', height: '100%', position: 'relative' }}>
              {[1,2,3].map(L => (
                <button key={L} onClick={() => setLvl(L)} style={{
                  border: lvl===L ? `2px solid var(--${t.family}-mid)` : '2px solid transparent',
                  background: lvl===L ? 'rgba(255,255,255,.04)' : 'transparent',
                  borderRadius: 'var(--r-md)', cursor: 'pointer', padding: 6,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
                }}>
                  <div style={{ width: '100%', flex: 1, display: 'grid', placeItems: 'end center' }}>
                    <div style={{ width: `${60 + L*12}%`, maxWidth: 150 }}><C level={L} /></div>
                  </div>
                  <span className="num" style={{ fontSize: 12, color: lvl===L ? `var(--${t.family}-mid)` : 'var(--text-dim)', marginTop: 4 }}>LVL {L}</span>
                </button>
              ))}
            </div>
          </StageBox>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>Tap a level to highlight. All three render live — idle animation always on.</p>
        </div>

        {/* info card */}
        <div className="card" style={{ padding: 22 }}>
          <div className="row gap2" style={{ marginBottom: 4 }}><FamilyDot family={t.family} /><span className="eyebrow" style={{ margin: 0, color: `var(--${t.family}-mid)` }}>{t.role}</span></div>
          <h3 className="h-md" style={{ fontSize: 26 }}>{t.emoji} {t.name}</h3>
          <p style={{ color: 'var(--text-soft)', fontSize: 14.5, marginTop: 8 }}>{t.desc}</p>
          <div style={{ height: 1, background: 'var(--bg-line)', margin: '16px 0' }} />
          <div className="col gap2">
            <div className="row between"><span className="muted" style={{ fontSize: 13 }}>Primary fill</span><span className="code">{t.token}</span></div>
            <div className="row between"><span className="muted" style={{ fontSize: 13 }}>Shades</span><span className="mono" style={{ fontSize: 11.5, color: 'var(--text-soft)' }}>--{t.family}-light / mid / dark</span></div>
            <div className="row between"><span className="muted" style={{ fontSize: 13 }}>Cost · range</span><span className="num" style={{ fontSize: 12.5, color: 'var(--text-soft)' }}>💰{t.cost} · {t.range}</span></div>
          </div>
          <div className="row gap2" style={{ marginTop: 14 }}>
            {['light','mid','dark'].map(s => <div key={s} style={{ flex: 1, height: 28, borderRadius: 8, background: `var(--${t.family}-${s})` }} />)}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-abyss)', borderRadius: 'var(--r-md)', border: '1px solid var(--bg-line)' }}>
            <div className="label" style={{ fontSize: 11, marginBottom: 6 }}>UPGRADE PROGRESSION</div>
            <div className="muted" style={{ fontSize: 12.5 }}>L1 → compact, single core · L2 → side decoration, brighter · L3 → crowned silhouette, max glow + extra FX.</div>
          </div>
        </div>
      </div>

      {/* footprint & range */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)', gap: 18, marginTop: 24 }} className="tower-grid">
        <div className="card" style={{ padding: 14 }}>
          <RangeFootprint tower={t} level={lvl} />
        </div>
        <div className="card" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ color: `var(--${t.family}-mid)` }}>Footprint & range · LVL {lvl}</div>
          <h3 className="h-md" style={{ marginBottom: 8 }}>Targeting radius grows on upgrade</h3>
          <p style={{ color: 'var(--text-soft)', fontSize: 14.5 }}>Top-down view of {t.name}’s reach. Enemies inside the dashed ring (red) are valid targets; greyed dots are out of range. Each upgrade widens the radius by ~one tile, so a maxed tower covers noticeably more lane.</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginTop:16 }}>
            {[['Base range', t.range],['Per level', '+1 tile'],['Footprint', '1×1'],['Placement', 'Grass']].map(([l,v]) => (
              <div key={l} style={{ background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:10, padding:'8px 10px' }}>
                <div className="num" style={{ fontSize:10, letterSpacing:'.1em', color:'var(--text-dim)', whiteSpace:'nowrap' }}>{l.toUpperCase()}</div>
                <div className="num" style={{ fontSize:15, color:`var(--${t.family}-mid)`, whiteSpace:'nowrap' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-abyss)', borderRadius: 'var(--r-md)', border: '1px solid var(--bg-line)' }}>
            <div className="muted" style={{ fontSize: 12.5 }}>Scrub the level buttons above — the ring resizes live to show the upgrade’s range gain.</div>
          </div>
        </div>
      </div>

      {/* full lineup */}
      <h3 className="h-md" style={{ marginTop: 32, marginBottom: 14 }}>Full lineup · level 2</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 12 }}>
        {keys.map(k => { const TC = TOWERS[k].comp; return (
          <div key={k} className="card" style={{ padding: 12 }}>
            <StageBox h={150} pad={8}><div style={{ width: '70%', height: '100%', display:'grid', placeItems:'end center' }}><TC level={2} /></div></StageBox>
            <div className="row gap2 center" style={{ marginTop: 8 }}><FamilyDot family={TOWERS[k].family} /><span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13.5 }}>{TOWERS[k].name}</span></div>
          </div>
        ); })}
      </div>
    </div>
  );
}

// ---------- ENEMIES ----------
function TabEnemies() {
  const keys = Object.keys(ENEMIES);
  const [state, setState] = useState('idle');
  const [dragPhase, setDragPhase] = useState(1);
  const tierColor = { Trash: 'var(--text-dim)', Flying: 'var(--storm-mid)', Special: 'var(--luna-mid)', Tank: 'var(--hive-mid)', 'Mini-boss': 'var(--gold)', 'Final boss': 'var(--danger)' };

  return (
    <div className="section">
      <SectionHead eyebrow="Enemy Sprites · 8 types" title="The deadly half of cute-but-deadly"
        lead="From swarming Grubs to the two-phase Neon Dragon. Each enemy ships with idle, walk, hit-flash, and death states. Toggle the state to preview how damage feedback reads." />

      <div className="row wrap gap2" style={{ marginBottom: 18 }}>
        <span className="label" style={{ alignSelf: 'center', marginRight: 4 }}>Preview state:</span>
        {[['idle','Idle'],['walk','Walk'],['hit','Hit flash'],['death','Death']].map(([k,l]) => (
          <button key={k} onClick={() => setState(k)} className="tab" style={{
            background: state===k ? 'linear-gradient(180deg,var(--gold),var(--gold-deep))' : 'var(--bg-panel)',
            color: state===k ? '#1a0f2e' : 'var(--text-dim)', border: '1px solid var(--bg-line)',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: 14 }}>
        {keys.map(k => {
          const e = ENEMIES[k]; const EC = e.comp;
          const isDragon = k === 'dragon';
          return (
            <div key={k} className="card" style={{ padding: 14 }}>
              <StageBox h={150} pad={8}>
                {/* tier badge — top-left corner */}
                <span className="tag" style={{ position:'absolute', top:8, left:8, zIndex:4, fontSize:10, padding:'3px 9px', color: tierColor[e.tier] || 'var(--text-soft)', borderColor:'var(--bg-line)', background:'rgba(20,12,38,.7)', backdropFilter:'blur(4px)' }}>{e.tier}</span>
                {/* floating in-game HP bar treatment */}
                <EnemyHpBar pct={e.hpPct} />
                <EnemyStateWrap state={state}>
                  <div style={{ width: '64%', height: '100%', display:'grid', placeItems:'center' }}>
                    {isDragon ? <EC phase={dragPhase} /> : <EC />}
                  </div>
                </EnemyStateWrap>
                {isDragon && (
                  <button onClick={(ev)=>{ev.stopPropagation(); setDragPhase(p=>p===1?2:1);}} style={{
                    position:'absolute', bottom:8, right:8, zIndex:3, fontFamily:'var(--font-display)', fontWeight:700, fontSize:11,
                    padding:'4px 9px', borderRadius:99, cursor:'pointer', border:'1px solid var(--bg-line)',
                    background: dragPhase===2?'var(--danger)':'var(--bubble-dark)', color:'#fff' }}>Phase {dragPhase}</button>
                )}
              </StageBox>
              {/* meta */}
              <div className="row gap2" style={{ marginTop: 12, alignItems:'center' }}>
                <span style={{ fontSize:18, lineHeight:1, flex:'0 0 auto' }}>{e.emoji}</span>
                <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16 }}>{e.name}</span>
              </div>
              <div className="row gap2" style={{ marginTop: 10 }}>
                <EnemyStat label="HP" value={e.hp} />
                <EnemyStat label="SPD" value={e.speed} />
              </div>
              <p className="muted" style={{ fontSize:12, marginTop:10, lineHeight:1.45 }}>{e.traits}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// wraps an enemy to demo walk (march), hit-flash (white tint) and death (fall + fade)
function EnemyStateWrap({ state, children }) {
  const key = state; // re-mount to restart animation
  const base = { width:'100%', height:'100%', display:'grid', placeItems:'center' };
  if (state === 'walk') {
    return <div key={key} style={{ ...base, animation: 'enemywalk 1.1s ease-in-out infinite' }}>{children}</div>;
  }
  if (state === 'hit') {
    return <div key={key} style={{ ...base, animation: 'hitflash 0.5s ease-out infinite' }}>{children}</div>;
  }
  if (state === 'death') {
    return <div key={key} style={{ ...base, animation: 'enemydeath 1.4s ease-in infinite', transformOrigin: 'center bottom' }}>{children}</div>;
  }
  return <div style={base}>{children}</div>;
}

// little labeled stat chip used on enemy cards
function EnemyStat({ label, value }) {
  return (
    <div style={{ flex:1, minWidth:0, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:10, padding:'6px 10px' }}>
      <div className="num" style={{ fontSize:10, letterSpacing:'.12em', color:'var(--text-dim)' }}>{label}</div>
      <div className="num" style={{ fontSize:14, color:'var(--text-bright)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{value}</div>
    </div>
  );
}

// floating in-game HP bar treatment shown above each enemy
function EnemyHpBar({ pct = 0.7 }) {
  const color = pct > 0.55 ? 'var(--hp-high)' : pct > 0.28 ? 'var(--hp-mid)' : 'var(--hp-low)';
  return (
    <div style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', width:66, zIndex:4 }}>
      <div style={{ height:8, borderRadius:99, background:'rgba(0,0,0,.55)', border:'1px solid rgba(255,255,255,.12)', padding:1.5, boxShadow:'0 2px 5px rgba(0,0,0,.4)' }}>
        <div style={{ width:`${pct*100}%`, height:'100%', borderRadius:99, background:color, boxShadow:`0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

// ---------- MAP ----------
function TabMap() {
  const tk = Object.keys(TILES), pk = Object.keys(PROPS);
  return (
    <div className="section">
      <SectionHead eyebrow="Map Tiles & Props" title="Isometric terrain kit"
        lead="Flat-vector diamond tiles snap into an iso grid. Grass is buildable; the dirt path is the enemy lane; water, lava and crystal add tactical texture. Scatter props for life." />

      {/* assembled mini-map */}
      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <div className="label" style={{ marginBottom: 14 }}>Assembled lane · how the kit reads in-game</div>
        <MiniMap />
      </div>

      <h3 className="h-md" style={{ marginBottom: 12 }}>Terrain tiles</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: 14, marginBottom: 28 }}>
        {tk.map(k => { const T = TILES[k]; const TC = T.comp; return (
          <div key={k} className="card" style={{ padding: 14 }}>
            <div style={{ height: 90, display:'grid', placeItems:'center' }}><div style={{ width: 120 }}><TC /></div></div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:14.5, marginTop:6 }}>{T.name}</div>
            <p className="muted" style={{ fontSize:12, marginTop:4 }}>{T.use}</p>
          </div>
        ); })}
      </div>

      <h3 className="h-md" style={{ marginBottom: 12 }}>Decorative props</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: 14 }}>
        {pk.map(k => { const P = PROPS[k]; const PC = P.comp; return (
          <div key={k} className="card" style={{ padding: 14, textAlign:'center' }}>
            <div style={{ height: 80, display:'grid', placeItems:'center' }}><div style={{ width: 64 }}><PC /></div></div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:13.5, marginTop:6 }}>{P.name}</div>
          </div>
        ); })}
      </div>
    </div>
  );
}

function MiniMap() {
  // 6x4 iso grid; define a path and some props
  const cols = 7, rows = 4;
  const path = new Set(['0,1','1,1','2,1','2,2','3,2','4,2','4,1','5,1','6,1']);
  const water = new Set(['5,3','6,3']);
  const tileW = 84, tileH = 42;
  const tiles = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const key = `${c},${r}`;
    const x = (c - r) * tileW/2 + 300;
    const y = (c + r) * tileH/2 + 10;
    let Comp = TILES.grass.comp;
    if (path.has(key)) Comp = TILES.path.comp;
    else if (water.has(key)) Comp = TILES.water.comp;
    tiles.push({ key, x, y, Comp, z: c + r });
  }
  tiles.sort((a,b) => a.z - b.z);
  const TB = TOWERS.blossom.comp, TL = TOWERS.luna.comp;
  return (
    <div style={{ position:'relative', height: 280, overflow:'hidden', borderRadius:'var(--r-md)', background:'radial-gradient(120% 120% at 50% 0%, var(--bg-stage), var(--bg-abyss))', border:'1px solid var(--bg-line)' }}>
      {tiles.map(t => (
        <div key={t.key} style={{ position:'absolute', left:t.x, top:t.y, width:tileW, height:tileH*2 }}>
          <t.Comp />
        </div>
      ))}
      {/* a couple of placed towers + props */}
      <div style={{ position:'absolute', left: 300 + (1-0)*42 - 4, top: 0*21 - 60, width: 70, zIndex: 50 }}><TB level={2} /></div>
      <div style={{ position:'absolute', left: 300 + (3-3)*42 - 4, top: 3*21 - 56, width: 64, zIndex: 60 }}><TL level={2} /></div>
      <div style={{ position:'absolute', left: 300 + (5-0)*42, top: 0*21 + 4, width: 36, zIndex: 55 }}><PropFlower /></div>
      <div style={{ position:'absolute', left: 300 + (0-3)*42, top: 3*21 + 6, width: 42, zIndex: 55 }}><PropTree /></div>
    </div>
  );
}

Object.assign(window, { TabTowers, TabEnemies, TabMap, StageBox });
