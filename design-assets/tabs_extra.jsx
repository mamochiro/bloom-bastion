/* global React, TOWERS, ENEMIES, TILES, PROPS, SectionHead, StageBox */
// ============================================================
// TABS — Biomes, Bosses, Accessibility
// ============================================================
const { useState: useStateX } = React;

// ---------- BIOMES ----------
// Same token system, three reskinned worlds. We override the stage
// background + accent and lean on the matching hazard tile.
const BIOMES = [
  { id:'frost', name:'Frostpeak', emoji:'❄️', tower:'bubble', hazard:'water', prop:'tree',
    bg:'radial-gradient(120% 110% at 50% 0%, #1d2b4a, #0c1426)', fog:'rgba(120,200,255,.14)',
    palette:['#0c1426','#1d2b4a','#5db8ff','#c6f0ff','#ffffff'],
    note:'Cold blues, white rime, slow-frozen lanes. Bubbler & Luna shine here.' },
  { id:'ember', name:'Emberfall', emoji:'🌋', tower:'sugar', hazard:'lava', prop:'mushroom',
    bg:'radial-gradient(120% 110% at 50% 0%, #3a1410, #170808)', fog:'rgba(255,120,60,.16)',
    palette:['#170808','#3a1410','#ff6b3d','#ffb74d','#ffe88a'],
    note:'Charred basalt, glowing cracks, falling embers. Splash towers feel huge.' },
  { id:'candy', name:'Sugarrush', emoji:'🍬', tower:'blossom', hazard:'crystal', prop:'flower',
    bg:'radial-gradient(120% 110% at 50% 0%, #3a1d44, #1d0f24)', fog:'rgba(255,140,200,.16)',
    palette:['#1d0f24','#3a1d44','#ff6fa5','#ffd34d','#c6fff0'],
    note:'Pastel frosting, gumdrop props, sprinkle particles. The signature look.' },
];

function BiomeVignette({ biome }) {
  const TC = TOWERS[biome.tower].comp;
  const Haz = TILES[biome.hazard].comp;
  const Grass = TILES.grass.comp, Path = TILES.path.comp;
  const Prop = PROPS[biome.prop].comp;
  return (
    <div style={{ position:'relative', height:200, borderRadius:'var(--r-md)', overflow:'hidden', background:biome.bg, border:'1px solid var(--bg-line)' }}>
      <div style={{ position:'absolute', inset:0, background:`radial-gradient(70% 60% at 50% 40%, ${biome.fog}, transparent)` }} />
      {/* drifting particles */}
      {Array.from({length:6}).map((_,i)=>(
        <div key={i} style={{ position:'absolute', top:`${10+i*13}%`, left:`${8+i*15}%`, width:5, height:5, borderRadius:i%2?2:99,
          background:biome.palette[3], opacity:.7, animation:`rise ${3+i%3}s linear ${i*0.5}s infinite`, animationDirection: i%2?'normal':'reverse' }} />
      ))}
      {/* tiny iso cluster */}
      <div style={{ position:'absolute', left:'50%', top:96, transform:'translateX(-50%)', width:74, zIndex:3 }}><TC level={2}/></div>
      <div style={{ position:'absolute', left:'30%', top:130, width:64 }}><Grass/></div>
      <div style={{ position:'absolute', left:'46%', top:138, width:64 }}><Path/></div>
      <div style={{ position:'absolute', left:'62%', top:130, width:64 }}><Haz/></div>
      <div style={{ position:'absolute', left:'24%', top:108, width:34, zIndex:4 }}><Prop/></div>
    </div>
  );
}

function TabBiomes() {
  return (
    <div className="section">
      <SectionHead eyebrow="Biomes · theming" title="One system, many worlds"
        lead="The whole palette is tokens, so a biome is just a background + accent swap plus the matching hazard tile. Same sprites, same HUD, three distinct moods — and room for more." />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:18 }}>
        {BIOMES.map(b => (
          <div key={b.id} className="card" style={{ padding:14 }}>
            <BiomeVignette biome={b} />
            <div className="row between" style={{ marginTop:12, alignItems:'center' }}>
              <div className="row gap2" style={{ alignItems:'center' }}><span style={{ fontSize:20 }}>{b.emoji}</span><span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18 }}>{b.name}</span></div>
              <span className="tag" style={{ fontSize:10 }}>{TILES[b.hazard].name}</span>
            </div>
            <p className="muted" style={{ fontSize:12.5, marginTop:8, lineHeight:1.45 }}>{b.note}</p>
            <div className="row gap2" style={{ marginTop:12 }}>
              {b.palette.map((c,i)=><div key={i} style={{ flex:1, height:22, borderRadius:6, background:c, border:'1px solid rgba(255,255,255,.08)' }} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding:18, marginTop:18 }}>
        <div className="label" style={{ marginBottom:8 }}>How a reskin works</div>
        <p className="muted" style={{ fontSize:13.5, maxWidth:'70ch' }}>Override three tokens per world — <span className="code">--bg-stage</span>, <span className="code">--bg-abyss</span>, and one accent — then pick the biome's hero hazard tile and particle. Towers, enemies, and the full HUD inherit automatically. No new art required to ship a season.</p>
      </div>
    </div>
  );
}

// ---------- BOSSES ----------
function PhaseBar({ beats }) {
  // beats: [{t:'Telegraph', c, w}] horizontal attack-pattern timeline
  return (
    <div style={{ display:'flex', borderRadius:99, overflow:'hidden', border:'1px solid var(--bg-line)', height:30 }}>
      {beats.map((b,i)=>(
        <div key={i} style={{ width:b.w, background:b.c, display:'grid', placeItems:'center', borderRight: i<beats.length-1?'1px solid rgba(0,0,0,.25)':'none' }}>
          <span className="num" style={{ fontSize:11, color:'#1a0f2e', fontWeight:800, whiteSpace:'nowrap', padding:'0 6px', overflow:'hidden' }}>{b.t}</span>
        </div>
      ))}
    </div>
  );
}

function TabBosses() {
  const [phase, setPhase] = useStateX(1);
  const King = ENEMIES.king.comp, Dragon = ENEMIES.dragon.comp;
  return (
    <div className="section">
      <SectionHead eyebrow="Boss Choreography" title="The set-pieces that need direction"
        lead="Bosses are where art, FX, and audio sync up. Each gets a telegraph → attack → recovery rhythm the player can read and counter. Here are the two anchors." />

      {/* CANDY KING */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,240px) minmax(0,1fr)' }} className="boss-grid">
          <div style={{ position:'relative', background:'radial-gradient(120% 100% at 50% 20%, var(--bg-stage), var(--bg-abyss))', display:'grid', placeItems:'center', padding:20, minHeight:240 }}>
            <div style={{ position:'absolute', width:150, height:150, borderRadius:'50%', background:'radial-gradient(circle, rgba(255,122,107,.22), transparent 70%)', animation:'pulse-glow 2.6s ease-in-out infinite' }} />
            <div style={{ width:150, position:'relative' }}><King/></div>
          </div>
          <div style={{ padding:22 }}>
            <div className="row gap2" style={{ marginBottom:4 }}><span className="tag" style={{ color:'var(--gold)', fontSize:10 }}>MINI-BOSS · WAVE 15</span></div>
            <h3 className="h-md" style={{ fontSize:24 }}>👑 Candy King</h3>
            <p style={{ color:'var(--text-soft)', fontSize:14, marginTop:6 }}>A tanky support boss. Every few seconds it raises its scepter and <strong style={{color:'var(--text-bright)'}}>heal-pulses</strong> nearby trash — kill the adds fast or it stalls forever.</p>
            <div style={{ marginTop:16 }}>
              <div className="label" style={{ fontSize:11, marginBottom:6 }}>HEAL-PULSE CYCLE</div>
              <PhaseBar beats={[
                { t:'Wind-up', c:'var(--hive-mid)', w:'26%' },
                { t:'Scepter flash', c:'var(--gold)', w:'18%' },
                { t:'♥ Heal burst', c:'var(--success)', w:'30%' },
                { t:'Vulnerable', c:'var(--blossom-mid)', w:'26%' },
              ]} />
              <div className="muted" style={{ fontSize:12, marginTop:8 }}>Telegraph: crown glows gold + audio chime 0.8s before the burst. The <strong style={{color:'var(--success)'}}>Vulnerable</strong> window is your damage opening.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16 }}>
              {[['FX','Gold ring + ♥ particles'],['Shake','Medium on burst'],['Audio','Duck + choir “aah”']].map(([l,v])=>(
                <div key={l} style={{ background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:10, padding:'8px 10px' }}><div className="num" style={{ fontSize:10, letterSpacing:'.1em', color:'var(--text-dim)' }}>{l.toUpperCase()}</div><div className="num" style={{ fontSize:12.5, color:'var(--gold)', marginTop:2 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* NEON DRAGON */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(0,240px) minmax(0,1fr)' }} className="boss-grid">
          <div style={{ position:'relative', background:`radial-gradient(120% 100% at 50% 20%, ${phase===2?'#3a1018':'var(--bg-stage)'}, var(--bg-abyss))`, display:'grid', placeItems:'center', padding:20, minHeight:240 }}>
            <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%', background:`radial-gradient(circle, ${phase===2?'rgba(255,77,109,.26)':'rgba(79,224,196,.2)'}, transparent 70%)`, animation:'pulse-glow 2.2s ease-in-out infinite' }} />
            <div style={{ width:170, position:'relative' }}><Dragon phase={phase}/></div>
            <button onClick={()=>setPhase(p=>p===1?2:1)} style={{ position:'absolute', bottom:12, fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, padding:'6px 14px', borderRadius:99, cursor:'pointer', border:'1px solid var(--bg-line)', background:phase===2?'var(--danger)':'var(--bubble-dark)', color:'#fff' }}>▶ Phase {phase} · tap to flip</button>
          </div>
          <div style={{ padding:22 }}>
            <div className="row gap2" style={{ marginBottom:4 }}><span className="tag" style={{ color:'var(--danger)', fontSize:10 }}>FINAL BOSS · WAVE 30</span></div>
            <h3 className="h-md" style={{ fontSize:24 }}>🐲 Neon Dragon</h3>
            <p style={{ color:'var(--text-soft)', fontSize:14, marginTop:6 }}>Two phases. At 50% HP it <strong style={{color:'var(--danger)'}}>enrages</strong> — mint turns to red, speed ramps, and it gains a fire-breath sweep across a lane.</p>
            <div style={{ marginTop:16 }}>
              <div className="label" style={{ fontSize:11, marginBottom:6 }}>PHASE TRANSITION (at 50% HP)</div>
              <PhaseBar beats={[
                { t:'Roar / freeze', c:'var(--luna-mid)', w:'22%' },
                { t:'Screen flash', c:'#fff', w:'14%' },
                { t:'Color shift→red', c:'var(--danger)', w:'34%' },
                { t:'Enraged', c:'var(--gold)', w:'30%' },
              ]} />
              <div className="muted" style={{ fontSize:12, marginTop:8 }}>Telegraph: full-screen roar + 0.4s slow-mo + heavy shake before red. Fire-breath sweeps telegraph with a charred ground line first.</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16 }}>
              {[['FX','Shake + flash + embers'],['Shake','Heavy on enrage'],['Audio','Orchestral → chiptune']].map(([l,v])=>(
                <div key={l} style={{ background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:10, padding:'8px 10px' }}><div className="num" style={{ fontSize:10, letterSpacing:'.1em', color:'var(--text-dim)' }}>{l.toUpperCase()}</div><div className="num" style={{ fontSize:12.5, color:'var(--danger)', marginTop:2 }}>{v}</div></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- ACCESSIBILITY ----------
function TabAccess() {
  const [motion, setMotion] = useStateX(true);
  return (
    <div className="section">
      <SectionHead eyebrow="Accessibility & game-feel" title="Readable, reachable, respectful"
        lead="Juice should never cost clarity. These are the floors every screen holds to: colorblind-safe states, motion you can dial down, and touch targets that never miss." />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))', gap:16 }}>
        {/* Colorblind HP */}
        <div className="card" style={{ padding:18 }}>
          <div className="label" style={{ marginBottom:4 }}>Colorblind-safe HP</div>
          <p className="muted" style={{ fontSize:12.5, marginBottom:14 }}>HP never relies on hue alone — fill level, an icon, and a shape cue all encode state.</p>
          {[['var(--hp-high)','92%','♥','Healthy'],['var(--hp-mid)','54%','◐','Hurt'],['var(--hp-low)','18%','✖','Critical']].map(([c,w,ic,l])=>(
            <div key={l} className="row gap3" style={{ marginBottom:10, alignItems:'center' }}>
              <span style={{ width:18, textAlign:'center', color:c, fontSize:14 }}>{ic}</span>
              <div style={{ flex:1, height:14, borderRadius:99, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', overflow:'hidden', position:'relative' }}>
                <div style={{ width:w, height:'100%', background:c, backgroundImage:'repeating-linear-gradient(45deg, rgba(0,0,0,.18) 0 4px, transparent 4px 8px)' }} />
              </div>
              <span className="num" style={{ width:60, fontSize:11.5, color:'var(--text-dim)' }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Reduced motion */}
        <div className="card" style={{ padding:18 }}>
          <div className="row between" style={{ marginBottom:4 }}><div className="label">Reduced motion</div>
            <button onClick={()=>setMotion(m=>!m)} style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, padding:'5px 12px', borderRadius:99, cursor:'pointer', border:'1px solid var(--bg-line)', background:motion?'var(--success)':'var(--bg-elevated)', color:motion?'#06301c':'var(--text-soft)' }}>{motion?'Motion ON':'Reduced'}</button>
          </div>
          <p className="muted" style={{ fontSize:12.5, marginBottom:14 }}>Honors <span className="code">prefers-reduced-motion</span>. Idle bobs, pulses and particles fall back to static; nothing essential is animation-only.</p>
          <StageBox h={120}>
            <div style={{ width:'40%', animation: motion ? 'bob 2.6s ease-in-out infinite' : 'none' }}>{React.createElement(TOWERS.blossom.comp,{level:2})}</div>
          </StageBox>
          <div className="muted" style={{ fontSize:11.5, marginTop:8, textAlign:'center' }}>{motion ? 'Full idle animation' : 'Static — same readable end-state'}</div>
        </div>

        {/* Touch targets */}
        <div className="card" style={{ padding:18 }}>
          <div className="label" style={{ marginBottom:4 }}>56px touch floor</div>
          <p className="muted" style={{ fontSize:12.5, marginBottom:14 }}>Every interactive control fills at least a 56×56px tap zone, even when the visual is smaller (dashed = hit area).</p>
          <div className="row gap3" style={{ flexWrap:'wrap' }}>
            {[['☀️','var(--gold)'],['❄️','var(--storm-mid)'],['⬆','var(--success)']].map(([i,c],n)=>(
              <div key={n} style={{ width:56, height:56, borderRadius:14, display:'grid', placeItems:'center', border:'2px dashed var(--bg-line)', position:'relative' }}>
                <div style={{ width:40, height:40, borderRadius:11, display:'grid', placeItems:'center', fontSize:18, background:'var(--bg-panel)', border:`2px solid ${c}` }}>{i}</div>
              </div>
            ))}
          </div>
          <div className="num" style={{ fontSize:11.5, color:'var(--text-dim)', marginTop:12 }}>40px glyph · 56px target · 8px gap min</div>
        </div>

        {/* Contrast */}
        <div className="card" style={{ padding:18 }}>
          <div className="label" style={{ marginBottom:4 }}>Text contrast</div>
          <p className="muted" style={{ fontSize:12.5, marginBottom:14 }}>HUD text holds ≥4.5:1 on the battlefield via frosted pill backings; large display text ≥3:1.</p>
          {[['Bright on panel','var(--text-bright)','var(--bg-panel)','AAA'],['Soft on stage','var(--text-soft)','var(--bg-stage)','AA'],['Gold on abyss','var(--gold)','var(--bg-abyss)','AA']].map(([l,fg,bg,r])=>(
            <div key={l} className="row between" style={{ padding:'8px 12px', borderRadius:10, background:bg, marginBottom:8, border:'1px solid var(--bg-line)' }}>
              <span style={{ color:fg, fontFamily:'var(--font-display)', fontWeight:700, fontSize:14 }}>{l}</span>
              <span className="num" style={{ fontSize:11, color:fg, opacity:.8 }}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TabBiomes, TabBosses, TabAccess });
