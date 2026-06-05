/* global React, TOWERS, ENEMIES, TILES, SectionHead, StageBox */
// ============================================================
// TABS — HUD mockup + FX / Juice reference
// ============================================================
const { useState: useStateH, useRef: useRefH, useEffect: useEffectH } = React;

// ---------- HUD ----------
function HudChip({ icon, value, color }) {
  return (
    <div className="row gap2" style={{ alignItems:'center', background:'rgba(20,12,38,.66)', backdropFilter:'blur(6px)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'5px 11px 5px 8px' }}>
      <span style={{ fontSize:15 }}>{icon}</span>
      <span className="num" style={{ fontSize:16, color, lineHeight:1 }}>{value}</span>
    </div>
  );
}

function PhoneHUD() {
  const TB = TOWERS.blossom.comp, TL = TOWERS.luna.comp, TS = TOWERS.storm.comp;
  const EG = ENEMIES.grub.comp, EF = ENEMIES.flutter.comp, EP = ENEMIES.plushy.comp;
  return (
    <div style={{ width: 320, height: 660, borderRadius: 38, padding: 10, background:'linear-gradient(160deg,#3a2563,#1a0f2e)', boxShadow:'0 30px 70px -20px #000, 0 0 0 2px var(--bg-line)' }}>
      <div style={{ position:'relative', width:'100%', height:'100%', borderRadius: 30, overflow:'hidden', background:'radial-gradient(120% 80% at 50% 20%, var(--bg-stage), var(--bg-abyss))' }}>
        {/* iso battlefield */}
        <div style={{ position:'absolute', inset:0 }}>
          <MiniBattle />
        </div>

        {/* notch */}
        <div style={{ position:'absolute', top:10, left:'50%', transform:'translateX(-50%)', width:90, height:22, background:'#0e0820', borderRadius:99, zIndex:30 }} />

        {/* top HUD strip */}
        <div style={{ position:'absolute', top:42, left:10, right:10, zIndex:20 }}>
          <div className="row between gap2">
            <HudChip icon="❤️" value="24" color="var(--danger)" />
            <HudChip icon="💰" value="1,250" color="var(--gold)" />
          </div>
          <div className="row between gap2" style={{ marginTop:8 }}>
            <HudChip icon="🌊" value="12/30" color="var(--storm-mid)" />
            <HudChip icon="⭐" value="86,400" color="var(--bubble-mid)" />
          </div>
          {/* wave progress */}
          <div style={{ marginTop:8, height:6, borderRadius:99, background:'rgba(0,0,0,.4)', overflow:'hidden', border:'1px solid var(--bg-line)' }}>
            <div style={{ width:'62%', height:'100%', background:'linear-gradient(90deg,var(--storm-mid),var(--bubble-mid))', boxShadow:'0 0 8px var(--storm-mid)' }} />
          </div>
        </div>

        {/* combo indicator */}
        <div style={{ position:'absolute', top:150, right:14, zIndex:20, textAlign:'right' }}>
          <div className="num" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, color:'var(--gold)', textShadow:'0 0 14px var(--gold)', lineHeight:.9 }}>×4</div>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:13, color:'var(--blossom-mid)', letterSpacing:'.1em' }}>COMBO!</div>
        </div>

        {/* floating dmg number */}
        <div className="num" style={{ position:'absolute', top:230, left:120, zIndex:20, fontSize:22, color:'#fff', textShadow:'0 0 6px var(--danger)', animation:'popnum 1.4s ease-out infinite' }}>-128</div>

        {/* bottom dock */}
        <div style={{ position:'absolute', left:0, right:0, bottom:0, zIndex:25, padding:'14px 10px 16px', background:'linear-gradient(0deg, var(--bg-abyss) 60%, transparent)' }}>
          {/* skill buttons */}
          <div className="row between" style={{ marginBottom:10, padding:'0 4px' }}>
            <div className="row gap3">
              {[['☀️','var(--gold)'],['❄️','var(--storm-mid)']].map(([i,c],n)=>(
                <div key={n} style={{ width:48, height:48, borderRadius:16, display:'grid', placeItems:'center', fontSize:20, background:'var(--bg-panel)', border:`2px solid ${c}`, boxShadow:`0 0 12px -2px ${c}` }}>{i}</div>
              ))}
            </div>
            <div style={{ width:56, height:56, borderRadius:'50%', display:'grid', placeItems:'center', background:'linear-gradient(180deg,var(--success),#2aa866)', boxShadow:'0 6px 0 #1c7a48, 0 0 16px -2px var(--success)' }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:11, color:'#06301c' }}>NEXT</span>
            </div>
          </div>
          {/* tower picker — horizontal scroll, with live states */}
          <div className="row gap2" style={{ overflowX:'auto', paddingBottom:4 }}>
            {Object.keys(TOWERS).map((k, i) => { const tw = TOWERS[k]; const TC = tw.comp;
              const selected = i === 0;          // currently picked
              const cooling = i === 1;           // on cooldown
              const locked = i === 5;            // not yet unlocked
              const gold = 1250;
              const afford = gold >= tw.cost && !locked;
              return (
              <div key={k} style={{ position:'relative', flex:'0 0 auto', width:62, borderRadius:14, padding:'6px 4px 4px',
                background: selected ? 'var(--bg-elevated)' : 'var(--bg-panel)',
                border: selected ? `2px solid var(--${tw.family}-mid)` : `1px solid var(--${tw.family}-dark)`,
                boxShadow: selected ? `0 0 14px -3px var(--${tw.family}-mid)` : 'none',
                transform: selected ? 'translateY(-4px)' : 'none',
                textAlign:'center', opacity: afford ? 1 : 0.55 }}>
                <div style={{ height:42, display:'grid', placeItems:'end center', filter: locked ? 'grayscale(1) brightness(.7)' : 'none' }}><div style={{ width:'78%' }}><TC level={1} /></div></div>
                {/* cooldown sweep */}
                {cooling && (
                  <div style={{ position:'absolute', top:6, left:4, right:4, height:42, borderRadius:10, overflow:'hidden', background:'rgba(10,6,20,.55)' }}>
                    <div style={{ position:'absolute', inset:0, background:'conic-gradient(transparent 0 38%, rgba(10,6,20,.78) 38% 100%)' }} />
                    <div className="num" style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'#fff', fontSize:15, textShadow:'0 1px 3px #000' }}>3s</div>
                  </div>
                )}
                {locked && <div style={{ position:'absolute', top:14, left:0, right:0, textAlign:'center', fontSize:18 }}>🔒</div>}
                <div className="num" style={{ fontSize:11, color: afford ? 'var(--gold)' : 'var(--danger)', marginTop:2 }}>💰{tw.cost}</div>
              </div>
            ); })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBattle() {
  // simple iso path with walking enemies
  const TB = TOWERS.blossom.comp, TL = TOWERS.luna.comp;
  const EG = ENEMIES.grub.comp, EP = ENEMIES.plushy.comp, EF = ENEMIES.flutter.comp;
  const cols=5, rows=7, tileW=78, tileH=39;
  const path = new Set(['2,0','2,1','2,2','1,2','1,3','1,4','2,4','3,4','3,5','3,6']);
  const tiles=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const key=`${c},${r}`;
    const x=(c-r)*tileW/2 + 120;
    const y=(c+r)*tileH/2 + 90;
    let Comp = path.has(key)?TILES.path.comp:TILES.grass.comp;
    tiles.push({key,x,y,Comp,z:c+r});
  }
  tiles.sort((a,b)=>a.z-b.z);
  return (
    <div style={{ position:'absolute', inset:0 }}>
      {tiles.map(t=> <div key={t.key} style={{ position:'absolute', left:t.x, top:t.y, width:tileW, height:tileH*2 }}><t.Comp/></div>)}
      {/* towers on grass */}
      <div style={{ position:'absolute', left:178, top:120, width:54, zIndex:40 }}><TB level={2}/></div>
      <div style={{ position:'absolute', left:60, top:210, width:50, zIndex:60 }}><TL level={2}/></div>
      {/* walking enemies along path */}
      <div style={{ position:'absolute', left:150, top:96, width:40, zIndex:50, animation:'enemymarch 6s linear infinite' }}><EG/></div>
      <div style={{ position:'absolute', left:120, top:200, width:46, zIndex:55, animation:'enemymarch2 6s linear infinite' }}><EP/></div>
      <div style={{ position:'absolute', left:200, top:160, width:36, zIndex:58, animation:'bob 1.6s ease-in-out infinite' }}><EF/></div>
    </div>
  );
}

function LandscapeHUD() {
  const TB = TOWERS.blossom.comp, TL = TOWERS.luna.comp, TS = TOWERS.storm.comp;
  const EG = ENEMIES.grub.comp, EP = ENEMIES.plushy.comp, EF = ENEMIES.flutter.comp;
  const railTowers = ['blossom','storm','sugar','luna','hive','bubble'];
  return (
    <div style={{ width:'min(720px,100%)', aspectRatio:'16 / 9', borderRadius:26, padding:9,
      background:'linear-gradient(160deg,#3a2563,#1a0f2e)', boxShadow:'0 26px 60px -22px #000, 0 0 0 2px var(--bg-line)' }}>
      <div style={{ position:'relative', width:'100%', height:'100%', borderRadius:18, overflow:'hidden',
        background:'radial-gradient(120% 90% at 50% 0%, var(--bg-stage), var(--bg-abyss))', display:'flex' }}>

        {/* battlefield (absolute, full) */}
        <div style={{ position:'absolute', inset:0 }}>
          <LandBattle />
        </div>

        {/* top status bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, display:'flex', justifyContent:'space-between', alignItems:'center',
          gap:8, padding:'8px 12px', background:'linear-gradient(180deg, rgba(14,8,32,.85), transparent)' }}>
          <div className="row gap2">
            <HudChip icon="❤️" value="24" color="var(--danger)" />
            <HudChip icon="💰" value="1,250" color="var(--gold)" />
          </div>
          <div className="col" style={{ alignItems:'center', gap:3, minWidth:130 }}>
            <div className="row gap2"><span className="num" style={{ fontSize:12, color:'var(--text-soft)' }}>🌊 WAVE</span><span className="num" style={{ fontSize:13, color:'var(--storm-mid)' }}>12/30</span></div>
            <div style={{ width:'100%', height:5, borderRadius:99, background:'rgba(0,0,0,.5)', overflow:'hidden', border:'1px solid var(--bg-line)' }}>
              <div style={{ width:'62%', height:'100%', background:'linear-gradient(90deg,var(--storm-mid),var(--bubble-mid))' }} />
            </div>
          </div>
          <div className="row gap2"><HudChip icon="⭐" value="86,400" color="var(--bubble-mid)" /></div>
        </div>

        {/* left tower rail */}
        <div style={{ position:'relative', zIndex:20, width:62, display:'flex', flexDirection:'column', gap:5, padding:'40px 7px 10px', overflowY:'hidden' }}>
          {railTowers.map((k, i) => { const tw = TOWERS[k]; const TC = tw.comp; const selected = i===0; return (
            <div key={k} style={{ position:'relative', borderRadius:11, padding:'3px 2px 2px', flex:'0 0 auto',
              background: selected ? 'var(--bg-elevated)':'rgba(45,27,78,.78)', backdropFilter:'blur(4px)',
              border: selected ? `2px solid var(--${tw.family}-mid)` : `1px solid var(--${tw.family}-dark)`,
              boxShadow: selected ? `0 0 12px -3px var(--${tw.family}-mid)`:'none', textAlign:'center' }}>
              <div style={{ height:28, display:'grid', placeItems:'end center' }}><div style={{ width:'66%' }}><TC level={1} /></div></div>
              <div className="num" style={{ fontSize:9.5, color:'var(--gold)' }}>💰{tw.cost}</div>
            </div>
          ); })}
        </div>

        <div style={{ flex:1 }} />

        {/* right skill rail */}
        <div style={{ position:'relative', zIndex:20, width:78, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center', gap:8, padding:'40px 10px 12px' }}>
          {/* combo */}
          <div style={{ textAlign:'center', marginBottom:'auto' }}>
            <div className="num" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:24, color:'var(--gold)', textShadow:'0 0 12px var(--gold)', lineHeight:.9 }}>×4</div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:10, color:'var(--blossom-mid)', letterSpacing:'.08em' }}>COMBO</div>
          </div>
          <div className="row gap2">
            {[['☀️','var(--gold)'],['❄️','var(--storm-mid)']].map(([i,c],n)=>(
              <div key={n} style={{ width:34, height:34, borderRadius:11, display:'grid', placeItems:'center', fontSize:15, background:'var(--bg-panel)', border:`2px solid ${c}`, boxShadow:`0 0 9px -2px ${c}` }}>{i}</div>
            ))}
          </div>
          <div style={{ width:58, height:46, borderRadius:14, display:'grid', placeItems:'center', background:'linear-gradient(180deg,var(--success),#2aa866)', boxShadow:'0 5px 0 #1c7a48, 0 0 14px -2px var(--success)' }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:11, color:'#06301c' }}>NEXT</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LandBattle() {
  const TB = TOWERS.blossom.comp, TL = TOWERS.luna.comp, TS = TOWERS.storm.comp;
  const EG = ENEMIES.grub.comp, EP = ENEMIES.plushy.comp, EF = ENEMIES.flutter.comp;
  const cols=8, rows=4, tileW=72, tileH=36;
  const path = new Set(['0,1','1,1','2,1','2,2','3,2','4,2','4,1','5,1','6,1','6,2','7,2']);
  const tiles=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const key=`${c},${r}`;
    const x=(c-r)*tileW/2 + 150;
    const y=(c+r)*tileH/2 + 70;
    let Comp = path.has(key)?TILES.path.comp:TILES.grass.comp;
    tiles.push({key,x,y,Comp,z:c+r});
  }
  tiles.sort((a,b)=>a.z-b.z);
  return (
    <div style={{ position:'absolute', inset:0 }}>
      {tiles.map(t=> <div key={t.key} style={{ position:'absolute', left:t.x, top:t.y, width:tileW, height:tileH*2 }}><t.Comp/></div>)}
      <div style={{ position:'absolute', left:228, top:78, width:46, zIndex:40 }}><TB level={2}/></div>
      <div style={{ position:'absolute', left:330, top:96, width:44, zIndex:50 }}><TL level={2}/></div>
      <div style={{ position:'absolute', left:150, top:96, width:40, zIndex:45 }}><TS level={2}/></div>
      <div style={{ position:'absolute', left:200, top:74, width:34, zIndex:60, animation:'enemymarch 6s linear infinite' }}><EG/></div>
      <div style={{ position:'absolute', left:300, top:60, width:30, zIndex:62, animation:'bob 1.6s ease-in-out infinite' }}><EF/></div>
      <div style={{ position:'absolute', left:380, top:96, width:40, zIndex:64, animation:'enemymarch2 6s linear infinite' }}><EP/></div>
    </div>
  );
}

function TabHUD() {
  return (
    <div className="section">
      <SectionHead eyebrow="HUD · Mobile portrait" title="Heads-up display, thumb-first"
        lead="Status pills float top, glanceable and tabular. The bottom dock holds a horizontal tower picker, two skill buttons, and a big NEXT-wave call to action — all above the 56px touch floor." />
      <div style={{ display:'grid', gridTemplateColumns:'auto minmax(0,1fr)', gap:32, alignItems:'start' }} className="hud-grid">
        <div style={{ display:'grid', placeItems:'center' }}><PhoneHUD /></div>
        <div className="col gap4">
          <Annotate n="Top strip" c="var(--storm-mid)" d="Lives · gold · wave · score as frosted pills with tabular numerals + a thin wave-progress bar. Always legible over the battlefield." />
          <Annotate n="Combo / streak" c="var(--gold)" d="Kills in quick succession stack a multiplier that punches in with scale + glow. Decays on a timer — pure dopamine." />
          <Annotate n="Tower picker" c="var(--blossom-mid)" d="Horizontally-scrolling deck of all 6 towers. Each card reads its state at a glance: selected (lifted + glowing ring), on cooldown (radial sweep + timer), can't-afford (dimmed, red cost), and locked (🔒, greyed). Drag onto a grass tile to place." />
          <Annotate n="Skill buttons" c="var(--success)" d="Left: active abilities (sun beam, freeze) with cooldown rings. Right: oversized NEXT-wave button — the primary action." />
          <div className="card" style={{ padding:16 }}>
            <div className="label" style={{ marginBottom:8 }}>Same tokens, two orientations</div>
            <p className="muted" style={{ fontSize:13 }}>Portrait keeps a bottom dock for thumb reach. On wider screens (below) the dock splits into a left tower rail + right skill rail, freeing vertical space for the battlefield. Status pills collapse into one top bar.</p>
          </div>
        </div>
      </div>

      {/* LANDSCAPE */}
      <h3 className="h-md" style={{ marginTop:40, marginBottom:6 }}>Landscape & desktop layout</h3>
      <p className="muted" style={{ fontSize:14, marginBottom:16, maxWidth:'62ch' }}>Re-flowed for width: top status bar, vertical tower rail on the left, skills + NEXT on the right, battlefield front and center.</p>
      <div className="card" style={{ padding:16, display:'grid', placeItems:'center' }}>
        <LandscapeHUD />
      </div>
    </div>
  );
}
function Annotate({ n, c, d }) {
  return (
    <div className="row gap3" style={{ alignItems:'flex-start' }}>
      <div style={{ width:10, height:10, borderRadius:99, background:c, boxShadow:`0 0 8px ${c}`, marginTop:5, flex:'0 0 auto' }} />
      <div><div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15.5, color:c }}>{n}</div><p className="muted" style={{ fontSize:13.5, marginTop:2 }}>{d}</p></div>
    </div>
  );
}

// ---------- FX / JUICE ----------
function TabFX() {
  return (
    <div className="section">
      <SectionHead eyebrow="FX & Juice" title="Make every hit feel good"
        lead="Juice is non-negotiable. These are the live recipes — tap any card to fire the effect. Same primitives power placement, fire, hits, deaths, and screen feedback." />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:16 }}>
        <HitFlashDemo />
        <ParticleBurstDemo />
        <ScreenShakeDemo />
        <ProjectileTrailDemo />
        <PlacementPreviewDemo />
        <DamageNumberDemo />
      </div>
      <div className="card" style={{ padding:20, marginTop:18 }}>
        <div className="label" style={{ marginBottom:10 }}>Screen-shake intensity guide</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12 }}>
          {[['Subtle','2px · 120ms','Tower fires, light hit','var(--bubble-mid)'],['Medium','6px · 220ms','Enemy death, ability cast','var(--gold)'],['Heavy','12px · 380ms','Boss slam, base damage','var(--danger)']].map(([t,s,u,c])=>(
            <div key={t} style={{ padding:12, borderRadius:'var(--r-md)', background:'var(--bg-abyss)', border:`1px solid ${c}` }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, color:c }}>{t}</div>
              <div className="num" style={{ fontSize:12, color:'var(--text-soft)', marginTop:2 }}>{s}</div>
              <div className="muted" style={{ fontSize:12, marginTop:4 }}>{u}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FXCard({ title, hint, children, onFire, fireLabel='Replay' }) {
  return (
    <div className="card" style={{ padding:16 }}>
      <div className="row between" style={{ marginBottom:10 }}>
        <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15 }}>{title}</span>
        <button onClick={onFire} style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, padding:'5px 12px', borderRadius:99, cursor:'pointer', border:0, background:'var(--bg-elevated)', color:'var(--bubble-mid)' }}>▶ {fireLabel}</button>
      </div>
      <StageBox h={150}>{children}</StageBox>
      <p className="muted" style={{ fontSize:12, marginTop:8 }}>{hint}</p>
    </div>
  );
}

function HitFlashDemo() {
  const [k,setK]=useStateH(0); const EG=ENEMIES.snail.comp;
  return <FXCard title="Hit flash" hint="On damage: white tint + brightness spike + tiny squash for 80ms. Reads as 'I connected'." onFire={()=>setK(k+1)}>
    <div key={k} style={{ width:'48%', height:'90%', display:'grid', placeItems:'center', animation:'hitflash .5s ease-out' }}><EG/></div>
  </FXCard>;
}

function ParticleBurstDemo() {
  const [k,setK]=useStateH(0);
  const parts = Array.from({length:12}).map((_,i)=>{ const a=(i/12)*Math.PI*2; return { x:Math.cos(a)*60, y:Math.sin(a)*60, c:['var(--blossom-mid)','var(--gold)','var(--bubble-mid)','var(--luna-mid)'][i%4] }; });
  return <FXCard title="Particle burst" hint="Enemy death sprays 10–14 colored shards on radial trajectories, scaling to zero. Confetti, not gore." onFire={()=>setK(k+1)}>
    <div key={k} style={{ position:'relative', width:0, height:0 }}>
      <div style={{ position:'absolute', width:18, height:18, borderRadius:99, border:'2px solid var(--gold)', left:-9, top:-9, animation:'ring-out .6s ease-out forwards' }} />
      {parts.map((p,i)=>(<div key={i} style={{ position:'absolute', width:8, height:8, borderRadius:2, background:p.c, left:-4, top:-4, '--bx':`${p.x}px`, '--by':`${p.y}px`, animation:'burst-out .7s ease-out forwards' }} />))}
    </div>
  </FXCard>;
}

function ScreenShakeDemo() {
  const [k,setK]=useStateH(0); const TB=TOWERS.sugar.comp;
  return <FXCard title="Screen shake" hint="Camera kick on impactful events. Translate-only, decaying amplitude — never rotate the camera." onFire={()=>setK(k+1)}>
    <div key={k} style={{ width:'100%', height:'100%', display:'grid', placeItems:'center', animation:'shake .4s' }}>
      <div style={{ width:'42%' }}><TB level={2}/></div>
    </div>
  </FXCard>;
}

function ProjectileTrailDemo() {
  return <FXCard title="Projectile trails" hint="Petals, candy, bolts leave a fading glow streak. Loops here; in-game it's a one-shot tween to target." onFire={()=>{}} fireLabel="Looping">
    <div style={{ position:'relative', width:'100%', height:'100%' }}>
      {[0,1,2].map(i=>(
        <div key={i} style={{ position:'absolute', top:`${40+i*22}%`, left:0, width:14, height:14, borderRadius:99, background:['var(--blossom-mid)','var(--gold)','var(--bubble-mid)'][i], boxShadow:`0 0 12px ${['var(--blossom-mid)','var(--gold)','var(--bubble-mid)'][i]}`, animation:`projfly 1.6s ${i*0.3}s linear infinite` }} />
      ))}
    </div>
  </FXCard>;
}

function PlacementPreviewDemo() {
  const TL=TOWERS.luna.comp;
  return <FXCard title="Placement preview" hint="While dragging a tower: semi-transparent ghost + dashed range circle. Green = valid tile, red = blocked." onFire={()=>{}} fireLabel="Ghost">
    <div style={{ position:'relative', width:'100%', height:'100%', display:'grid', placeItems:'center' }}>
      <div style={{ position:'absolute', width:130, height:130, borderRadius:'50%', border:'2px dashed var(--success)', background:'radial-gradient(circle, rgba(68,224,138,.14), transparent 70%)', animation:'spin-slow 16s linear infinite' }} />
      <div style={{ width:'34%', opacity:.55, filter:'drop-shadow(0 0 6px var(--success))' }}><TL level={2}/></div>
    </div>
  </FXCard>;
}

function DamageNumberDemo() {
  const [k,setK]=useStateH(0);
  return <FXCard title="Floating damage" hint="Numbers pop, arc up, fade. Crits are bigger + gold. Tabular so they don't wobble." onFire={()=>setK(k+1)}>
    <div key={k} style={{ position:'relative', width:'100%', height:'100%' }}>
      <div className="num" style={{ position:'absolute', left:'40%', bottom:'30%', fontSize:24, color:'#fff', textShadow:'0 0 6px var(--danger)', animation:'popnum 1.3s ease-out forwards' }}>-128</div>
      <div className="num" style={{ position:'absolute', left:'58%', bottom:'34%', fontSize:32, color:'var(--gold)', fontWeight:800, textShadow:'0 0 10px var(--gold)', animation:'popnum 1.5s .2s ease-out forwards' }}>-340!</div>
    </div>
  </FXCard>;
}

Object.assign(window, { TabHUD, TabFX });
