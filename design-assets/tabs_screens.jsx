/* global React, TOWERS, ENEMIES, SectionHead, StageBox */
// ============================================================
// TABS — Screens, Sound, Export
// ============================================================

function MiniPhone({ children, label }) {
  return (
    <div>
      <div style={{ width: 248, height: 510, borderRadius: 30, padding: 8, background:'linear-gradient(160deg,#3a2563,#1a0f2e)', boxShadow:'0 22px 50px -18px #000, 0 0 0 2px var(--bg-line)', margin:'0 auto' }}>
        <div style={{ position:'relative', width:'100%', height:'100%', borderRadius: 23, overflow:'hidden', background:'radial-gradient(120% 80% at 50% 10%, var(--bg-stage), var(--bg-abyss))' }}>{children}</div>
      </div>
      <div style={{ textAlign:'center', marginTop:10, fontFamily:'var(--font-display)', fontWeight:700, fontSize:13.5, color:'var(--text-soft)' }}>{label}</div>
    </div>
  );
}

function MenuBtn({ children, kind='ghost', size=15, style }) {
  const cls = kind==='primary'?'btn-primary':kind==='gold'?'btn-gold':'btn-ghost';
  return <button className={`btn ${cls}`} style={{ width:'100%', fontSize:size, minHeight:46, padding:'10px 18px', ...style }}>{children}</button>;
}

// ---------- SETTINGS PRIMITIVES (portrait-phone scale) ----------
// pill toggle — static, reflects `on`
function SetToggle({ on }) {
  return (
    <div style={{ width:40, height:23, borderRadius:99, padding:3, display:'flex', alignItems:'center',
      justifyContent: on ? 'flex-end' : 'flex-start',
      background: on ? 'linear-gradient(180deg,var(--success),#2aa866)' : 'var(--bg-abyss)',
      border:`1px solid ${on ? '#2aa866' : 'var(--bg-line)'}`,
      boxShadow: on ? '0 0 10px -2px var(--success)' : 'inset 0 1px 2px rgba(0,0,0,.4)', flex:'0 0 auto' }}>
      <div style={{ width:17, height:17, borderRadius:'50%', background:'#fff6ff', boxShadow:'0 1px 3px rgba(0,0,0,.5)' }} />
    </div>
  );
}
// mini volume slider — static, fill = value%
function SetSlider({ value, color='var(--bubble-mid)' }) {
  return (
    <div style={{ width:92, height:6, borderRadius:99, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', position:'relative', flex:'0 0 auto' }}>
      <div style={{ position:'absolute', top:-1, bottom:-1, left:-1, width:`calc(${value}% + 2px)`, borderRadius:99, background:`linear-gradient(90deg, ${color}, color-mix(in oklch, ${color} 70%, #fff))`, boxShadow:`0 0 8px ${color}` }} />
      <div style={{ position:'absolute', top:'50%', left:`${value}%`, transform:'translate(-50%,-50%)', width:15, height:15, borderRadius:'50%', background:'#fff6ff', boxShadow:'0 1px 4px rgba(0,0,0,.55)' }} />
    </div>
  );
}
// one settings row inside a SetGroup card
function SetRow({ icon, label, sub, right, last }) {
  return (
    <div className="row between" style={{ padding:'9px 11px', gap:8, borderBottom: last ? 'none' : '1px solid var(--bg-line)' }}>
      <div className="row gap2" style={{ alignItems:'center', minWidth:0 }}>
        <span style={{ fontSize:13.5, width:17, textAlign:'center', flex:'0 0 auto' }}>{icon}</span>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12.5, color:'var(--text-bright)', whiteSpace:'nowrap' }}>{label}</div>
          {sub && <div className="muted" style={{ fontSize:10, lineHeight:1.2, whiteSpace:'nowrap' }}>{sub}</div>}
        </div>
      </div>
      <div style={{ flex:'0 0 auto' }}>{right}</div>
    </div>
  );
}
// grouped card with a section eyebrow
function SetGroup({ title, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--luna-mid)', margin:'0 4px 6px' }}>{title}</div>
      <div style={{ background:'var(--bg-panel)', border:'1px solid var(--bg-line)', borderRadius:'var(--r-md)', overflow:'hidden', boxShadow:'var(--shadow-card)' }}>{children}</div>
    </div>
  );
}
// value + chevron for nav rows (language, credits…)
function SetNav({ value }) {
  return <span className="num row gap2" style={{ fontSize:11, color:'var(--text-soft)', alignItems:'center' }}>{value}<span style={{ color:'var(--text-dim)', fontSize:14, fontFamily:'var(--font-display)' }}>›</span></span>;
}
// small circular icon toggle for the pause quick-bar
function SetQuick({ icon, on, label }) {
  return (
    <div className="col center" style={{ gap:4 }}>
      <div style={{ width:42, height:42, borderRadius:13, display:'grid', placeItems:'center', fontSize:17, position:'relative',
        background: on ? 'var(--bg-elevated)' : 'var(--bg-abyss)',
        border:`1.5px solid ${on ? 'var(--bubble-mid)' : 'var(--bg-line)'}`,
        color: on ? 'var(--bubble-mid)' : 'var(--text-faint)',
        boxShadow: on ? '0 0 12px -3px var(--bubble-mid)' : 'none', opacity: on ? 1 : .7 }}>
        {icon}
        {!on && <div style={{ position:'absolute', width:30, height:2, background:'var(--danger)', transform:'rotate(-45deg)', borderRadius:2, boxShadow:'0 0 4px var(--danger)' }} />}
      </div>
      <span className="num" style={{ fontSize:8.5, letterSpacing:'.08em', color: on ? 'var(--text-dim)' : 'var(--text-faint)', textTransform:'uppercase' }}>{label}</span>
    </div>
  );
}

// onboarding coach-mark bubble with a pointer arrow
function Coach({ top, left, text, arrow='down' }) {
  return (
    <div style={{ position:'absolute', top, left, transform:'translate(-50%,-50%)', zIndex:6, width:150, textAlign:'center' }}>
      {arrow==='up' && <div style={{ width:0, height:0, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderBottom:'9px solid var(--gold)', margin:'0 auto 1px' }} />}
      <div style={{ background:'linear-gradient(180deg,#ffe88a,var(--gold))', color:'#2a1d00', fontFamily:'var(--font-display)', fontWeight:800, fontSize:12.5, lineHeight:1.25, padding:'9px 12px', borderRadius:12, boxShadow:'0 6px 18px -4px rgba(0,0,0,.6)' }}>{text}</div>
      {arrow==='down' && <div style={{ width:0, height:0, borderLeft:'8px solid transparent', borderRight:'8px solid transparent', borderTop:'9px solid var(--gold)', margin:'1px auto 0' }} />}
    </div>
  );
}

// shared screen header (back chevron + title + optional right slot)
function ScreenHeader({ title, right }) {
  return (
    <div className="row between" style={{ padding:'13px 12px 11px', borderBottom:'1px solid var(--bg-line)', background:'linear-gradient(180deg, rgba(14,8,32,.6), transparent)', flex:'0 0 auto' }}>
      <div className="row gap2" style={{ alignItems:'center', minWidth:0 }}>
        <div style={{ width:30, height:30, borderRadius:99, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', display:'grid', placeItems:'center', color:'var(--text-soft)', fontSize:17, fontFamily:'var(--font-display)', paddingBottom:2, flex:'0 0 auto' }}>‹</div>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18, whiteSpace:'nowrap' }}>{title}</div>
      </div>
      {right}
    </div>
  );
}
// gold balance chip
function GoldChip({ amount }) {
  return <div className="row gap2" style={{ alignItems:'center', background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'4px 11px', flex:'0 0 auto' }}><span style={{ fontSize:13 }}>💰</span><span className="num" style={{ fontSize:13, color:'var(--gold)' }}>{amount}</span></div>;
}

// ---------- SCREENS ----------
function TabScreens() {
  const TB=TOWERS.blossom.comp, TBu=TOWERS.bubble.comp, TL=TOWERS.luna.comp;
  const ED=ENEMIES.dragon.comp, EK=ENEMIES.king.comp;
  return (
    <div className="section">
      <SectionHead eyebrow="Screens" title="The full front-to-back flow"
        lead="Splash → menu → settings → difficulty → play → pause → result. Every screen reuses the same pastel-on-dark system, chunky Baloo buttons, and glow. Portrait shown; all reflow to landscape." />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(248px,1fr))', gap:34, justifyItems:'center' }}>

        {/* SPLASH */}
        <MiniPhone label="Splash / Title">
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
            <div style={{ position:'absolute', width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(255,111,165,.3),transparent 70%)', animation:'pulse-glow 3s ease-in-out infinite' }} />
            <div style={{ position:'relative' }}>
              <div style={{ width:90, margin:'0 auto' }}><TB level={3}/></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, lineHeight:.95, marginTop:6 }}><span style={{color:'var(--blossom-mid)'}}>Bloom</span><br/><span style={{color:'var(--bubble-mid)'}}>Bastion</span></div>
              <div className="num" style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'.3em', marginTop:8 }}>TAP TO START</div>
            </div>
          </div>
        </MiniPhone>

        {/* MAIN MENU */}
        <MiniPhone label="Main menu">
          <div style={{ position:'absolute', inset:0, padding:'46px 22px', display:'flex', flexDirection:'column' }}>
            <div style={{ textAlign:'center', marginBottom:18 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:26, lineHeight:.9 }}><span style={{color:'var(--blossom-mid)'}}>Bloom</span> <span style={{color:'var(--bubble-mid)'}}>Bastion</span></div>
            </div>
            <div className="col gap3" style={{ flex:1 }}>
              <MenuBtn kind="primary" size={16}>▶ Play</MenuBtn>
              <MenuBtn kind="gold">♾ Endless</MenuBtn>
              <MenuBtn>🛒 Shop</MenuBtn>
              <MenuBtn>⚙ Settings</MenuBtn>
            </div>
            <div className="num" style={{ textAlign:'center', fontSize:11, color:'var(--text-faint)' }}>v1.0 · best wave 18</div>
          </div>
        </MiniPhone>

        {/* SETTINGS */}
        <MiniPhone label="Settings">
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
            {/* header */}
            <div className="row gap2" style={{ alignItems:'center', padding:'14px 12px 11px', borderBottom:'1px solid var(--bg-line)', background:'linear-gradient(180deg, rgba(14,8,32,.6), transparent)', flex:'0 0 auto' }}>
              <div style={{ width:30, height:30, borderRadius:99, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', display:'grid', placeItems:'center', color:'var(--text-soft)', fontSize:17, fontFamily:'var(--font-display)', paddingBottom:2 }}>‹</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18 }}>Settings</div>
            </div>
            {/* scrollable body */}
            <div style={{ flex:1, overflowY:'auto', padding:'13px 11px 16px' }}>
              <SetGroup title="Audio">
                <SetRow icon="🎵" label="Music" right={<SetSlider value={68} color="var(--bubble-mid)" />} />
                <SetRow icon="🔊" label="Sound FX" right={<SetSlider value={85} color="var(--blossom-mid)" />} last />
              </SetGroup>
              <SetGroup title="Gameplay">
                <SetRow icon="📳" label="Haptics" sub="Vibrate on hits" right={<SetToggle on />} />
                <SetRow icon="💥" label="Screen shake" right={<SetToggle on />} />
                <SetRow icon="🌀" label="Reduced motion" sub="Calmer effects" right={<SetToggle on={false} />} last />
              </SetGroup>
              <SetGroup title="General">
                <SetRow icon="🌐" label="Language" right={<SetNav value="English" />} />
                <SetRow icon="🔔" label="Notifications" sub="Daily bloom reward" right={<SetToggle on />} last />
              </SetGroup>
              <SetGroup title="Account">
                <SetRow icon="☁️" label="Cloud save" sub="poppy@bloom.gg" right={<span className="tag" style={{ fontSize:10, padding:'3px 9px', color:'var(--success)', background:'var(--bg-abyss)' }}>✓ Synced</span>} />
                <SetRow icon="🛍️" label="Restore purchases" right={<SetNav value="" />} last />
              </SetGroup>
              <SetGroup title="About">
                <SetRow icon="💛" label="Credits" right={<SetNav value="" />} />
                <SetRow icon="📄" label="Privacy & terms" right={<SetNav value="" />} last />
              </SetGroup>
              <div className="num" style={{ textAlign:'center', fontSize:10, color:'var(--text-faint)', marginTop:4 }}>Bloom Bastion · v1.0.3</div>
            </div>
          </div>
        </MiniPhone>

        {/* DIFFICULTY */}
        <MiniPhone label="Difficulty select">
          <div style={{ position:'absolute', inset:0, padding:'46px 18px' }}>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:20, textAlign:'center', marginBottom:16 }}>Choose your fight</div>
            <div className="col gap3">
              {[['Sprout','easy','10 waves','var(--success)'],['Bloom','normal','20 waves','var(--gold)'],['Bastion','hard','30 waves + boss','var(--danger)']].map(([n,t,s,c])=>(
                <div key={n} style={{ padding:'12px 14px', borderRadius:'var(--r-md)', background:'var(--bg-panel)', border:`2px solid ${c}`, boxShadow:`0 0 14px -6px ${c}` }}>
                  <div className="row between"><span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:16, color:c }}>{n}</span><span className="num" style={{ fontSize:11, color:'var(--text-dim)' }}>{t.toUpperCase()}</span></div>
                  <div className="muted" style={{ fontSize:12, marginTop:2 }}>{s}</div>
                </div>
              ))}
            </div>
          </div>
        </MiniPhone>

        {/* IN-GAME PAUSE */}
        <MiniPhone label="In-game pause">
          {/* faint battlefield behind */}
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--bg-line) 1px, transparent 1px)', backgroundSize:'22px 22px', opacity:.5 }} />
          <div style={{ position:'absolute', top:40, left:26, width:52, opacity:.5 }}><TB level={2} /></div>
          <div style={{ position:'absolute', top:118, right:24, width:40, opacity:.45 }}><ED phase={1} /></div>
          {/* HUD chips (get dimmed by the overlay) */}
          <div className="row between" style={{ position:'absolute', top:0, left:0, right:0, padding:12 }}>
            <div className="row gap2" style={{ alignItems:'center', background:'rgba(20,12,38,.7)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'4px 10px' }}><span style={{ fontSize:13 }}>❤️</span><span className="num" style={{ fontSize:13, color:'var(--danger)' }}>24</span></div>
            <div className="row gap2" style={{ alignItems:'center', background:'rgba(20,12,38,.7)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'4px 10px' }}><span style={{ fontSize:13 }}>💰</span><span className="num" style={{ fontSize:13, color:'var(--gold)' }}>340</span></div>
          </div>
          {/* dim overlay */}
          <div style={{ position:'absolute', inset:0, background:'rgba(8,5,18,.76)', backdropFilter:'blur(2px)' }} />
          {/* pause panel */}
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', padding:18 }}>
            <div style={{ width:'100%', maxWidth:202, borderRadius:'var(--r-xl)', background:'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border:'1px solid var(--bg-line)', boxShadow:'var(--shadow-panel)', padding:'18px 16px', textAlign:'center' }}>
              <div className="num" style={{ fontSize:9.5, letterSpacing:'.28em', color:'var(--text-dim)' }}>WAVE 12 / 30</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, letterSpacing:'.05em', lineHeight:1, marginTop:2, textShadow:'0 0 18px rgba(179,136,255,.55)' }}>PAUSED</div>
              <div className="col gap2" style={{ marginTop:15 }}>
                <MenuBtn kind="primary" size={15}>▶ Resume</MenuBtn>
                <MenuBtn kind="gold" size={14}>↻ Restart wave</MenuBtn>
                <MenuBtn size={14}>⚙ Settings</MenuBtn>
                <MenuBtn size={14} style={{ color:'var(--danger)', borderColor:'color-mix(in oklch, var(--danger) 45%, var(--bg-line))' }}>⌂ Quit to menu</MenuBtn>
              </div>
              {/* quick audio toggles */}
              <div className="row center gap4" style={{ marginTop:16, paddingTop:14, borderTop:'1px solid var(--bg-line)' }}>
                <SetQuick icon="🎵" on label="Music" />
                <SetQuick icon="🔊" on={false} label="SFX" />
              </div>
            </div>
          </div>
        </MiniPhone>

        {/* WAVE CLEAR */}
        <MiniPhone label="Wave clear">
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', background:'rgba(14,8,32,.55)', backdropFilter:'blur(2px)' }}>
            <div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, color:'var(--bubble-mid)', textShadow:'0 0 18px var(--bubble-mid)' }}>WAVE 12</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:'var(--text-bright)' }}>CLEARED!</div>
              <div className="row center gap3" style={{ marginTop:14 }}>
                <div className="num" style={{ color:'var(--gold)' }}>+250 💰</div>
                <div className="num" style={{ color:'var(--blossom-mid)' }}>×4 combo</div>
              </div>
              <div style={{ marginTop:18, width:160, margin:'18px auto 0' }}><MenuBtn kind="primary">Next wave →</MenuBtn></div>
            </div>
          </div>
        </MiniPhone>

        {/* WIN */}
        <MiniPhone label="Victory">
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 30%, rgba(68,224,138,.18), transparent 60%)' }} />
            {Array.from({length:10}).map((_,i)=>(<div key={i} style={{ position:'absolute', top:'10%', left:`${10+i*8}%`, width:7, height:7, borderRadius:2, background:['var(--blossom-mid)','var(--gold)','var(--bubble-mid)','var(--luna-mid)'][i%4], animation:`rise ${2+i%3}s linear ${i*0.2}s infinite`, animationDirection:'reverse' }} />))}
            <div style={{ position:'relative' }}>
              <div style={{ fontSize:40 }}>🏆</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, color:'var(--success)', textShadow:'0 0 18px var(--success)' }}>VICTORY!</div>
              <div className="row center gap2" style={{ marginTop:8 }}>{[1,2,3].map(s=><span key={s} style={{ fontSize:24, color:'var(--gold)' }}>★</span>)}</div>
              <div className="num" style={{ fontSize:13, color:'var(--text-soft)', marginTop:8 }}>Score 86,400 · No lives lost</div>
              <div style={{ marginTop:16, width:170 }}><MenuBtn kind="gold">Claim 500 💰</MenuBtn></div>
            </div>
          </div>
        </MiniPhone>

        {/* LOSE */}
        <MiniPhone label="Defeat">
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', background:'radial-gradient(circle at 50% 40%, rgba(255,77,109,.16), transparent 60%)' }}>
            <div>
              <div style={{ width:70, margin:'0 auto', opacity:.9 }}><ED phase={2}/></div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:28, color:'var(--danger)', textShadow:'0 0 18px var(--danger)', marginTop:4 }}>BASTION FELL</div>
              <div className="num" style={{ fontSize:13, color:'var(--text-soft)', marginTop:6 }}>Reached wave 12 / 30</div>
              <div className="col gap2" style={{ marginTop:16, width:170, margin:'16px auto 0' }}>
                <MenuBtn kind="primary">↻ Retry</MenuBtn>
                <MenuBtn>Main menu</MenuBtn>
              </div>
            </div>
          </div>
        </MiniPhone>
      </div>

      {/* MENU BRANCHES & PRE-GAME */}
      <h3 className="h-md" style={{ marginTop:40, marginBottom:6 }}>Menu branches &amp; pre-game</h3>
      <p className="muted" style={{ fontSize:14, marginBottom:16, maxWidth:'62ch' }}>Where a run gets set up — the store, the endless ladder, and the loadout you carry into battle. Same chunky cards, gold accents, and per-family tower colors as the rest of the game.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(248px,1fr))', gap:34, justifyItems:'center' }}>

        {/* SHOP */}
        <MiniPhone label="Shop / store">
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
            <ScreenHeader title="Shop" right={<GoldChip amount="340" />} />
            <div style={{ flex:1, overflowY:'auto', padding:'13px 11px 16px' }}>
              {/* featured bundle */}
              <div style={{ position:'relative', borderRadius:'var(--r-lg)', overflow:'hidden', padding:'13px 14px 12px', marginBottom:14, background:'linear-gradient(120deg, var(--blossom-dark), var(--luna-dark))', border:'1px solid var(--bg-line)', boxShadow:'var(--shadow-card)' }}>
                <span className="num" style={{ position:'absolute', top:9, left:13, fontSize:8.5, letterSpacing:'.2em', color:'var(--gold)' }}>★ FEATURED</span>
                <div className="row between" style={{ alignItems:'flex-end', marginTop:11 }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:15, color:'#fff6ff', whiteSpace:'nowrap' }}>Sakura Bundle</div>
                    <div style={{ fontSize:10, color:'rgba(255,246,255,.8)', marginBottom:10, whiteSpace:'nowrap' }}>3 skins + 2,000 gold</div>
                    <span className="btn btn-gold" style={{ minHeight:0, padding:'6px 15px', fontSize:12.5, borderRadius:99, boxShadow:'0 3px 0 var(--gold-deep)' }}>$6.99</span>
                  </div>
                  <div style={{ width:46, flex:'0 0 auto' }}><TB level={3} /></div>
                </div>
              </div>
              {/* gold packs */}
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--luna-mid)', margin:'0 4px 8px' }}>Gold packs</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
                {[['🪙','500','$0.99',null],['💰','3,000','$4.99','POPULAR'],['💎','8,000','$9.99','+20%'],['👑','20,000','$19.99','BEST']].map(([ic,amt,pr,bdg])=>(
                  <div key={amt} style={{ position:'relative', background:'var(--bg-panel)', border:`1px solid ${bdg==='POPULAR'?'var(--gold-deep)':'var(--bg-line)'}`, borderRadius:'var(--r-md)', padding:'13px 8px 10px', textAlign:'center', boxShadow:'var(--shadow-card)' }}>
                    {bdg && <span className="num" style={{ position:'absolute', top:-7, left:'50%', transform:'translateX(-50%)', fontSize:8, letterSpacing:'.06em', color:'#2a1d00', background:'linear-gradient(180deg,#ffe88a,var(--gold))', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap', boxShadow:'0 2px 6px -1px rgba(0,0,0,.5)' }}>{bdg}</span>}
                    <div style={{ fontSize:21 }}>{ic}</div>
                    <div className="num" style={{ fontSize:14, color:'var(--gold)', margin:'3px 0 9px' }}>{amt}</div>
                    <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:12, color:'#06301c', background:'linear-gradient(180deg,var(--success),#2aa866)', borderRadius:99, padding:'5px 0', boxShadow:'0 3px 0 #1c7a48' }}>{pr}</div>
                  </div>
                ))}
              </div>
              {/* skins */}
              <SetGroup title="Tower skins">
                {[['blossom','Sakura','Default skin',<span key="r" className="tag" style={{ fontSize:9.5, padding:'3px 9px', color:'var(--success)', background:'var(--bg-abyss)' }}>✓ Equipped</span>],
                  ['luna','Eclipse','Luna Crystal',<span key="r" className="num" style={{ fontSize:11, color:'var(--gold)' }}>💰 1,200</span>],
                  ['bubble','Coral','Bubbler',<span key="r" className="num" style={{ fontSize:10.5, color:'var(--text-faint)' }}>🔒 Wave 25</span>]].map(([fam,nm,sub,right],i,a)=>{
                  const C = TOWERS[fam].comp;
                  return (
                    <div key={nm} className="row between" style={{ padding:'9px 11px', gap:8, borderBottom: i===a.length-1?'none':'1px solid var(--bg-line)' }}>
                      <div className="row gap3" style={{ alignItems:'center', minWidth:0 }}>
                        <div style={{ width:34, height:34, borderRadius:10, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', display:'grid', placeItems:'center', overflow:'hidden', flex:'0 0 auto' }}><div style={{ width:22 }}><C level={1} /></div></div>
                        <div style={{ minWidth:0 }}><div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12.5, color:'var(--text-bright)' }}>{nm}</div><div className="muted" style={{ fontSize:10 }}>{sub}</div></div>
                      </div>
                      <div style={{ flex:'0 0 auto' }}>{right}</div>
                    </div>
                  );
                })}
              </SetGroup>
            </div>
          </div>
        </MiniPhone>

        {/* ENDLESS */}
        <MiniPhone label="Endless mode">
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
            <ScreenHeader title="♾ Endless" />
            <div style={{ flex:1, overflowY:'auto', padding:'13px 11px 16px', display:'flex', flexDirection:'column' }}>
              {/* hero best wave */}
              <div style={{ textAlign:'center', padding:'10px 0 14px', borderRadius:'var(--r-lg)', background:'radial-gradient(circle at 50% 0%, rgba(179,136,255,.2), transparent 72%)', marginBottom:14 }}>
                <div className="num" style={{ fontSize:9, letterSpacing:'.28em', color:'var(--text-dim)' }}>YOUR BEST</div>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:38, lineHeight:1, color:'var(--luna-light)', textShadow:'0 0 20px rgba(179,136,255,.6)', margin:'3px 0 5px' }}>Wave 18</div>
                <div className="num" style={{ fontSize:10.5, color:'var(--text-soft)' }}>12:40 survived · 86,400 pts</div>
              </div>
              {/* mutators */}
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--luna-mid)', margin:'0 4px 8px' }}>Mutators · bonus score</div>
              <div className="col gap2" style={{ marginBottom:14 }}>
                {[['⚡','Double time','Enemies move 2× faster','+25%',true],['💎','Glass cannon','Big damage, one life','+40%',false],['🌫','Fog of war','Limited tower vision','+30%',true]].map(([ic,nm,sub,mult,sel])=>(
                  <div key={nm} className="row between" style={{ padding:'9px 11px', gap:8, borderRadius:'var(--r-md)', background: sel?'var(--bg-elevated)':'var(--bg-panel)', border:`1.5px solid ${sel?'var(--luna-mid)':'var(--bg-line)'}`, boxShadow: sel?'0 0 12px -4px var(--luna-mid)':'none' }}>
                    <div className="row gap2" style={{ alignItems:'center', minWidth:0 }}>
                      <span style={{ fontSize:15, flex:'0 0 auto' }}>{ic}</span>
                      <div style={{ minWidth:0 }}><div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, color:'var(--text-bright)' }}>{nm}</div><div className="muted" style={{ fontSize:9.5, whiteSpace:'nowrap' }}>{sub}</div></div>
                    </div>
                    <div className="row gap2" style={{ alignItems:'center', flex:'0 0 auto' }}>
                      <span className="num" style={{ fontSize:10.5, color:'var(--gold)' }}>{mult}</span>
                      <div style={{ width:19, height:19, borderRadius:6, display:'grid', placeItems:'center', fontSize:11, fontWeight:800, background: sel?'var(--luna-mid)':'transparent', border:`1.5px solid ${sel?'var(--luna-mid)':'var(--bg-line)'}`, color:'#1a0f2e' }}>{sel?'✓':''}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* leaderboard */}
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:9.5, letterSpacing:'.18em', textTransform:'uppercase', color:'var(--luna-mid)', margin:'0 4px 8px' }}>Friends</div>
              <div style={{ background:'var(--bg-panel)', border:'1px solid var(--bg-line)', borderRadius:'var(--r-md)', overflow:'hidden', marginBottom:14, boxShadow:'var(--shadow-card)' }}>
                {[['🥇','You','18','var(--gold)'],['🥈','Mochi','16','var(--text-soft)'],['🥉','Pixel','14','var(--hive-mid)'],['4','Tofu','11','var(--text-dim)']].map(([rk,nm,wv,c],i,a)=>(
                  <div key={nm} className="row between" style={{ padding:'8px 11px', gap:8, borderBottom: i===a.length-1?'none':'1px solid var(--bg-line)', background: nm==='You'?'rgba(255,215,0,.07)':'transparent' }}>
                    <div className="row gap2" style={{ alignItems:'center' }}><span className="num" style={{ width:18, textAlign:'center', fontSize:13, color:c }}>{rk}</span><span style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:12.5, color: nm==='You'?'var(--gold)':'var(--text-bright)' }}>{nm}</span></div>
                    <span className="num" style={{ fontSize:11.5, color:'var(--text-soft)' }}>Wave {wv}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'auto' }}><MenuBtn kind="gold" size={15}>▶ Start endless run</MenuBtn></div>
            </div>
          </div>
        </MiniPhone>

        {/* PRE-GAME LOADOUT */}
        <MiniPhone label="Pre-game loadout">
          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column' }}>
            <ScreenHeader title="Loadout" right={<span className="num" style={{ fontSize:12, color:'var(--text-soft)', background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'4px 11px', flex:'0 0 auto' }}>3 / 4</span>} />
            <div style={{ flex:1, overflowY:'auto', padding:'12px 11px 12px' }}>
              <p className="muted" style={{ fontSize:11.5, margin:'0 2px 12px' }}>Pick up to 4 towers to carry into this run.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[['blossom',true,false],['storm',false,false],['sugar',true,false],['luna',false,false],['bubble',true,false],['hive',false,true]].map(([fam,sel,locked])=>{
                  const t = TOWERS[fam]; const C = t.comp;
                  return (
                    <div key={fam} style={{ position:'relative', padding:'9px 8px 9px', borderRadius:'var(--r-md)', textAlign:'center', background: sel?'var(--bg-elevated)':'var(--bg-panel)', border:`1.5px solid ${sel?`var(${t.token})`:'var(--bg-line)'}`, boxShadow: sel?`0 0 12px -4px var(${t.token})`:'none', opacity: locked?.5:1, overflow:'hidden' }}>
                      {sel && <div style={{ position:'absolute', top:6, right:6, width:17, height:17, borderRadius:'50%', display:'grid', placeItems:'center', fontSize:10, fontWeight:800, background:`var(${t.token})`, color:'#1a0f2e', zIndex:2 }}>✓</div>}
                      {locked && <div style={{ position:'absolute', top:6, right:7, fontSize:12, zIndex:2 }}>🔒</div>}
                      <div style={{ height:42, display:'grid', placeItems:'end center' }}><div style={{ width:'46%' }}><C level={1} /></div></div>
                      <div style={{ fontFamily:'var(--font-display)', fontWeight:700, fontSize:11, color:'var(--text-bright)', marginTop:5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{t.name}</div>
                      <div className="num" style={{ fontSize:10, color: locked?'var(--text-faint)':'var(--gold)', marginTop:1 }}>{locked?'🔒 Wave 8':`💰 ${t.cost}`}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* deploy bar */}
            <div style={{ flex:'0 0 auto', padding:'10px 12px 13px', borderTop:'1px solid var(--bg-line)', background:'rgba(14,8,32,.95)', backdropFilter:'blur(6px)' }}>
              <div className="row gap2" style={{ marginBottom:9, justifyContent:'center' }}>
                {['blossom','sugar','bubble',null].map((fam,i)=> fam ? (
                  <div key={i} style={{ width:38, height:38, borderRadius:10, background:'var(--bg-abyss)', border:`1.5px solid var(${TOWERS[fam].token})`, display:'grid', placeItems:'center', overflow:'hidden' }}><div style={{ width:'56%' }}>{React.createElement(TOWERS[fam].comp,{level:1})}</div></div>
                ) : (
                  <div key={i} style={{ width:38, height:38, borderRadius:10, background:'var(--bg-abyss)', border:'1.5px dashed var(--bg-line)', display:'grid', placeItems:'center', color:'var(--text-faint)', fontSize:18 }}>+</div>
                ))}
              </div>
              <MenuBtn kind="primary" size={15}>▶ To battle</MenuBtn>
            </div>
          </div>
        </MiniPhone>
      </div>

      {/* ONBOARDING */}
      <h3 className="h-md" style={{ marginTop:40, marginBottom:6 }}>First-run onboarding · coach marks</h3>
      <p className="muted" style={{ fontSize:14, marginBottom:16, maxWidth:'62ch' }}>The loop is taught in-context on wave 1 — three timed coach marks with a dimmed backdrop and a pulsing pointer. No wall of text, no separate tutorial level.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(248px,1fr))', gap:34, justifyItems:'center' }}>
        {/* Step 1 */}
        <MiniPhone label="1 · Place a tower">
          <div style={{ position:'absolute', inset:0, background:'rgba(8,5,18,.6)' }} />
          <Coach top="62%" left="50%" text="Drag a tower onto a grass tile" arrow="down" />
          <div style={{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', zIndex:5, width:60, borderRadius:14, padding:'6px 4px 4px', background:'var(--bg-panel)', border:'2px solid var(--blossom-mid)', boxShadow:'0 0 16px -2px var(--blossom-mid)', textAlign:'center' }}>
            <div style={{ height:40, display:'grid', placeItems:'end center' }}><div style={{ width:'78%' }}><TB level={1}/></div></div>
            <div className="num" style={{ fontSize:10, color:'var(--gold)' }}>💰120</div>
          </div>
          <div style={{ position:'absolute', top:'46%', left:'46%', width:40, height:24, borderRadius:6, border:'2px dashed var(--success)', zIndex:4, animation:'pulse-glow 1.4s ease-in-out infinite' }} />
        </MiniPhone>
        {/* Step 2 */}
        <MiniPhone label="2 · Start the wave">
          <div style={{ position:'absolute', inset:0, background:'rgba(8,5,18,.6)' }} />
          <Coach top="40%" left="50%" text="Tap NEXT to send the first wave" arrow="down" />
          <div style={{ position:'absolute', bottom:24, right:18, zIndex:5, width:60, height:60, borderRadius:'50%', display:'grid', placeItems:'center', background:'linear-gradient(180deg,var(--success),#2aa866)', boxShadow:'0 0 0 6px rgba(68,224,138,.25), 0 6px 0 #1c7a48', animation:'pulse-glow 1.4s ease-in-out infinite' }}>
            <span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:12, color:'#06301c' }}>NEXT</span>
          </div>
        </MiniPhone>
        {/* Step 3 */}
        <MiniPhone label="3 · Defend your lives">
          <div style={{ position:'absolute', inset:0, background:'rgba(8,5,18,.6)' }} />
          <Coach top="50%" left="50%" text="Don’t let them reach the heart!" arrow="up" />
          <div style={{ position:'absolute', top:18, left:18, zIndex:5, display:'flex', alignItems:'center', gap:6, background:'rgba(20,12,38,.7)', border:'1px solid var(--bg-line)', borderRadius:99, padding:'5px 11px', boxShadow:'0 0 0 5px rgba(255,77,109,.22)', animation:'pulse-glow 1.4s ease-in-out infinite' }}>
            <span style={{ fontSize:15 }}>❤️</span><span className="num" style={{ fontSize:16, color:'var(--danger)' }}>24</span>
          </div>
        </MiniPhone>
      </div>

      {/* UPGRADE MODAL */}
      <h3 className="h-md" style={{ marginTop:40, marginBottom:16 }}>Tower detail / Upgrade panel · mid-game modal</h3>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <UpgradeModal />
      </div>

      {/* ECONOMY */}
      <h3 className="h-md" style={{ marginTop:40, marginBottom:6 }}>Wave & economy loop</h3>
      <p className="muted" style={{ fontSize:14, marginBottom:16, maxWidth:'62ch' }}>The reward curve that paces the whole run — earn, spend, survive, repeat. Tuned so a clean wave funds roughly one upgrade.</p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
        {[
          ['💀','Per kill','+2–25','Scales with enemy tier. Bosses drop a lump sum.','var(--gold)'],
          ['🌊','Wave clear','+50 ×wave','Flat bonus that grows each wave. The economy backbone.','var(--bubble-mid)'],
          ['🏦','Interest','+10% / wave','Banked gold earns interest — rewards saving for big buys.','var(--success)'],
          ['🔥','Combo bonus','+5% / streak','Fast consecutive kills add a gold multiplier on top.','var(--blossom-mid)'],
        ].map(([i,l,v,d,c]) => (
          <div key={l} className="card" style={{ padding:16, borderTop:`3px solid ${c}` }}>
            <div className="row between"><span style={{ fontSize:20 }}>{i}</span><span className="num" style={{ fontSize:18, color:c }}>{v}</span></div>
            <div style={{ fontFamily:'var(--font-display)', fontWeight:800, marginTop:8, fontSize:15 }}>{l}</div>
            <p className="muted" style={{ fontSize:12.5, marginTop:4 }}>{d}</p>
          </div>
        ))}
      </div>
      <div className="card" style={{ padding:20 }}>
        <div className="label" style={{ marginBottom:14 }}>Upgrade cost curve · gold per level</div>
        <div className="row gap4 wrap" style={{ alignItems:'flex-end' }}>
          {[['LVL 1','120','42%','var(--blossom-light)'],['LVL 2','320','68%','var(--blossom-mid)'],['LVL 3','760','100%','var(--blossom-dark)']].map(([l,g,h,c]) => (
            <div key={l} className="col" style={{ alignItems:'center', flex:1, minWidth:80 }}>
              <span className="num" style={{ fontSize:13, color:'var(--gold)', marginBottom:10, padding:'3px 10px', borderRadius:99, background:'var(--bg-abyss)', border:'1px solid var(--bg-line)', whiteSpace:'nowrap' }}>💰 {g}</span>
              <div style={{ width:'100%', maxWidth:90, height:130, background:'var(--bg-abyss)', borderRadius:10, display:'flex', alignItems:'flex-end', border:'1px solid var(--bg-line)', overflow:'hidden' }}>
                <div style={{ width:'100%', height:h, background:`linear-gradient(180deg, ${c}, var(--blossom-dark))`, boxShadow:`0 0 16px -4px ${c}` }} />
              </div>
              <span className="num" style={{ fontSize:13, color:'var(--text-soft)', marginTop:8 }}>{l}</span>
            </div>
          ))}
          <div style={{ flex:'1 1 200px', minWidth:200, color:'var(--text-soft)', fontSize:13.5, alignSelf:'center' }}>
            Costs roughly <strong style={{color:'var(--text-bright)'}}>2.4×</strong> per level — early upgrades feel cheap and frequent, while a level-3 tower is a deliberate, run-defining investment. Sell value refunds <strong style={{color:'var(--text-bright)'}}>60%</strong> of total spent.
          </div>
        </div>
      </div>
    </div>
  );
}

function UpgradeModal() {
  const TB=TOWERS.blossom.comp;
  return (
    <div style={{ position:'relative', minHeight:380, background:'radial-gradient(120% 100% at 50% 0%, var(--bg-stage), var(--bg-abyss))', display:'grid', placeItems:'center', padding:24 }}>
      {/* blurred bg hint */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, var(--bg-line) 1px, transparent 1px)', backgroundSize:'26px 26px', opacity:.18, filter:'blur(1px)' }} />
      <div style={{ position:'relative', width:'min(420px,100%)', borderRadius:'var(--r-xl)', background:'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border:'1px solid var(--bg-line)', boxShadow:'var(--shadow-panel)', overflow:'hidden' }}>
        <div className="row between" style={{ padding:'16px 18px', borderBottom:'1px solid var(--bg-line)' }}>
          <div className="row gap2"><span style={{fontSize:18}}>🌸</span><span style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:18 }}>Blossom</span><span className="tag" style={{ fontSize:10, padding:'2px 8px', color:'var(--blossom-mid)' }}>LVL 2</span></div>
          <div style={{ width:30, height:30, borderRadius:99, background:'var(--bg-abyss)', display:'grid', placeItems:'center', color:'var(--text-dim)', cursor:'pointer' }}>✕</div>
        </div>
        <div className="row gap4" style={{ padding:18 }}>
          <div style={{ width:96, flex:'0 0 auto' }}><StageBox h={120} pad={6}><div style={{width:'78%',height:'100%',display:'grid',placeItems:'end center'}}><TB level={2}/></div></StageBox></div>
          <div style={{ flex:1 }}>
            {[['Damage','42','64','var(--blossom-mid)'],['Range','3.0','3.6','var(--storm-mid)'],['Fire rate','1.4/s','1.8/s','var(--bubble-mid)']].map(([s,a,b,c])=>(
              <div key={s} style={{ marginBottom:10 }}>
                <div className="row between"><span className="muted" style={{ fontSize:12.5 }}>{s}</span><span className="num" style={{ fontSize:12.5 }}><span style={{color:'var(--text-dim)'}}>{a}</span> <span style={{color:c}}>→ {b}</span></span></div>
                <div style={{ height:7, borderRadius:99, background:'var(--bg-abyss)', overflow:'hidden', marginTop:4, border:'1px solid var(--bg-line)' }}><div style={{ width:'70%', height:'100%', background:c, boxShadow:`0 0 8px ${c}` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="row gap3" style={{ padding:'0 18px 18px' }}>
          <button className="btn btn-gold" style={{ flex:2, minHeight:50 }}>⬆ Upgrade · 💰 320</button>
          <button className="btn btn-ghost" style={{ flex:1, minHeight:50, color:'var(--danger)' }}>Sell</button>
        </div>
      </div>
    </div>
  );
}

// ---------- SOUND ----------
function TabSound() {
  const [copied, setCopied] = React.useState('');
  const copy = (text, id) => { navigator.clipboard?.writeText(text); setCopied(id); setTimeout(() => setCopied(''), 1300); };

  const sfx = [
    ['🏗','Tower place','Reassuring, confirms placement','Wooden marimba thunk + 2-note sine chime · ~0.25s · C5→E5','Short, satisfying tower-placement sound for a cute pastel tower-defense game: a soft wooden marimba thunk layered with a gentle two-note ascending sine chime (C5 to E5). ~0.25s, snappy attack, soft decay, no reverb tail, bright and friendly, chiptune-meets-orchestral.'],
    ['⬆','Upgrade','The level-up dopamine hit','Ascending 4-note major arpeggio on celesta + sparkle · ~0.6s','Rewarding level-up sound effect: a quick ascending four-note major arpeggio on a glassy bell/celesta with a soft sparkle shimmer tail. ~0.6s, triumphant but cute, mobile game UI.'],
    ['💰','Sell / refund','Soft cash-back, never negative','Reversed coin shimmer → single warm chime · ~0.4s','Gentle cash-back sound: a soft reversed coin shimmer resolving into one warm bell chime. ~0.4s, friendly and positive, mobile game.'],
    ['🎯','Enemy hit','Subtle so rapid fire never fatigues','Filtered-noise tick + tiny pitched blip · ~0.08s · dry','Very short, quiet impact tick for a cute game: a soft filtered-noise "tk" with a tiny pitched blip on top. ~0.08s, completely dry, low volume so it does not fatigue during rapid fire.'],
    ['💀','Enemy death','Cute, never gory','Bubbly pop + bright coin ting · ~0.3s','Cute enemy-defeat sound: a bubbly "pop" plus a small bright coin "ting". ~0.3s, playful and harmless, chiptune mobile game. (Combo stacks raise the pitch a semitone each.)'],
    ['💥','Boss death','Big celebratory payoff','Cartoon poof + brass stab + falling sparkles · ~1.2s','Big celebratory boss-defeat sound: a bright cartoon explosion "poof" layered with a short triumphant brass stab and descending sparkle chimes. ~1.2s, joyful, mobile game.'],
    ['🪙','Gold pickup','Glanceable reward tick','Clean metallic coin ting · ~0.15s','Classic bright coin-pickup "ting", clean and metallic with a quick decay, ~0.15s, cute mobile game.'],
    ['🔥','Combo up','Climbs as the streak grows','Rising square-wave blip · ~0.12s','Short rising pitched "blip" for a combo counter; a clean square-wave note that feels like it is climbing a scale, ~0.12s, chiptune. Generate a few at rising pitches.'],
    ['👆','UI tap','Soft, rounded, friendly','Bubble pop / bloop · ~0.1s','Soft UI button-tap sound: a gentle rounded bubble "pop"/"bloop", ~0.1s, friendly mobile game interface.'],
    ['🚫','Invalid action','Polite, not harsh','Low descending two-tone buzz · ~0.25s','Gentle "denied" error sound: a soft low descending two-tone buzz, polite and non-aggressive, ~0.25s, cute mobile game.'],
    ['💔','Life lost','Disappointing, not punishing','Descending 2-note minor motif · ~0.5s','Gentle "oh no" sound when an enemy breaks through: a soft descending two-note minor motif on a mellow synth, disappointing but warm and not punishing, ~0.5s.'],
    ['🌊','Wave start','Builds anticipation','Snare/timpani roll → bright horn stab · ~1s','Wave-start cue: a short snare and timpani drum roll building into a bright horn stab, ~1s, anticipation. Boss waves add a low ominous brass swell underneath.'],
    ['🏆','Wave clear','Satisfying resolve','Triumphant major arpeggio + glockenspiel · ~1.2s','Wave-cleared jingle: a quick triumphant ascending major arpeggio finished with a glockenspiel sparkle, ~1.2s, satisfying and cute.'],
  ];

  const fires = [
    ['blossom','🌸 Blossom','Soft petal whoosh with a tiny harp pluck, airy and light, ~0.15s.'],
    ['storm','⚡ Stormcloud','Crackly electric zap with a short thunder snap, ~0.2s, energetic.'],
    ['sugar','🍭 Sugar Cannon','Bouncy candy "boing" launch with a soft wet splat on impact, ~0.3s, playful.'],
    ['luna','🌙 Luna Crystal','Shimmering glassy crystalline beam, sustained ethereal tone, ~0.4s.'],
    ['hive','🐝 Hive','Buzzy kazoo-like swarm pluck, comedic and light, ~0.15s.'],
    ['bubble','🌊 Bubbler','Watery round bubble "bloop"/pop, wet and soft, ~0.2s.'],
  ];

  const music = [
    ['🎵','Main menu','Cozy, whimsical, inviting','Loop · ~90 BPM · C major','Instrumental, looping, cozy game-menu theme: pizzicato strings, glockenspiel, soft 8-bit square lead and light mallets. ~90 BPM, C major, warm, gentle and inviting, chiptune-meets-orchestral. Seamless loop.','var(--bubble-mid)'],
    ['⚔️','Battle · Meadow','Upbeat, driving, charming','Loop · ~120 BPM · major','Instrumental, looping battle theme for a cute tower-defense game: upbeat playful chiptune layered with orchestral strings and light percussion, driving but charming, ~120 BPM, major key, energetic and fun. Seamless loop.','var(--blossom-mid)'],
    ['🌍','Biome reskins','Same melody, swapped palette','Frost · Ember · Candy','Re-instrument the battle loop per biome, keeping the same melody: Frostpeak = airy bells and icy pads, slightly slower; Emberfall = darker brass and tribal drums; Sugarrush = bubbly synths and glockenspiel. Instrumental, looping.','var(--storm-mid)'],
    ['🐲','Boss battle','Intense but still playful','Loop · ~140 BPM · minor','Instrumental, looping boss theme: intense and driving, a distorted chiptune lead over heavy orchestral brass and timpani, ~140 BPM, tense minor key, epic yet playful. Seamless loop.','var(--danger)'],
    ['🎉','Victory fanfare','Triumphant, brief','One-shot · ~4s','Short triumphant victory fanfare: bright brass and glockenspiel rising to a major-key resolve, ~4s, celebratory, not looping.','var(--success)'],
    ['🥀','Defeat jingle','Warm, encouraging','One-shot · ~3s','Short gentle defeat jingle: a soft descending woodwind and strings motif, minor key but warm and encouraging, ~3s, not punishing, not looping.','var(--luna-mid)'],
  ];

  const stings = [
    ['👑','Candy King intro','Regal but playful mini-boss fanfare: a bright trumpet flourish with a sugary bell glissando, ~2s, comedic grandeur.'],
    ['🐉','Neon Dragon · Phase 1','Ominous final-boss intro sting: a low synth drone swelling into a big orchestral hit, ~2.5s, dread and scale.'],
    ['🔴','Neon Dragon · Phase 2 (enrage)','Phase-2 enrage stinger: a distorted bass drop into an aggressive fast chiptune lead kicking in, ~2s, adrenaline spike.'],
  ];

  const CopyBtn = ({ id, text, small }) => (
    <button onClick={() => copy(text, id)} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: small ? 11 : 12, padding: small ? '4px 10px' : '6px 13px', borderRadius: 99, cursor: 'pointer', border: '1px solid var(--bg-line)', background: copied === id ? 'var(--success)' : 'var(--bg-elevated)', color: copied === id ? '#06301c' : 'var(--bubble-mid)', whiteSpace: 'nowrap', transition: 'background .15s' }}>{copied === id ? '✓ Copied' : '⧉ Copy prompt'}</button>
  );

  return (
    <div className="section">
      <SectionHead eyebrow="Sound Design · audio brief" title="Bright chiptune meets orchestral"
        lead="Playful 8-bit timbres over warm orchestral pads — cute on the surface, real weight on bosses. Every cue below has a feel, a technical spec, and a copy-paste prompt for an AI audio generator. Reference: PvZ2, Clash Royale, Monument Valley." />

      {/* how to use */}
      <div className="card" style={{ padding: 16, marginBottom: 18, borderLeft: '3px solid var(--gold)' }}>
        <div className="row gap3" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20 }}>🎛️</span>
          <p className="muted" style={{ fontSize: 13.5, margin: 0 }}>I can’t render audio here — these are <b style={{ color: 'var(--text-soft)' }}>ready-to-paste prompts</b>. Send the <b style={{ color: 'var(--text-soft)' }}>SFX</b> prompts to a text-to-sound tool (ElevenLabs SFX, Optimizer, etc.) and the <b style={{ color: 'var(--text-soft)' }}>music</b> prompts to a music generator (Suno, Udio). Each “Copy prompt” button copies the full, self-contained prompt.</p>
        </div>
      </div>

      {/* sonic palette */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 24 }}>
        {[['Instruments','Square + triangle leads · pizzicato strings · glockenspiel/celesta · soft brass · mallets · 8-bit noise for hits','var(--bubble-mid)'],['Key & tempo','Core C major; bosses shift minor. Menu 90 · battle 120 · boss 140 BPM. +8% on the final 3 waves','var(--gold)'],['Loudness','SFX dry & short; music sits −6 dB under SFX; duck music −3 dB on boss intro; mono-compatible','var(--blossom-mid)']].map(([t,d,c])=>(
          <div key={t} className="card" style={{ padding: 16, borderTop: `3px solid ${c}` }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, color: c }}>{t}</div><p className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>{d}</p></div>
        ))}
      </div>

      {/* SFX */}
      <h3 className="h-md" style={{ marginBottom: 14 }}>Sound effects · {sfx.length} cues</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12, marginBottom: 28 }}>
        {sfx.map(([i,n,feel,spec,prompt]) => (
          <div key={n} className="card" style={{ padding: 14 }}>
            <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
              <div className="row gap3" style={{ alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-abyss)', display: 'grid', placeItems: 'center', fontSize: 17, flex: '0 0 auto', border: '1px solid var(--bg-line)' }}>{i}</div>
                <div style={{ minWidth: 0 }}><div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>{n}</div><div className="muted" style={{ fontSize: 12 }}>{feel}</div></div>
              </div>
            </div>
            <div className="mono" style={{ fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11, color: 'var(--bubble-light)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 8, padding: '6px 9px', margin: '10px 0' }}>{spec}</div>
            <CopyBtn id={'sfx-'+n} text={prompt} />
          </div>
        ))}
      </div>

      {/* tower fire variants */}
      <h3 className="h-md" style={{ marginBottom: 6 }}>Tower fire · one timbre per family</h3>
      <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Each tower needs a distinct shot so the battlefield reads by ear alone.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12, marginBottom: 28 }}>
        {fires.map(([fam,n,prompt]) => (
          <div key={fam} className="card" style={{ padding: 14, borderTop: `3px solid var(--${fam}-mid)` }}>
            <div className="row between" style={{ alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>{n}</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 10, minHeight: 34 }}>{prompt}</p>
            <CopyBtn id={'fire-'+fam} text={'Tower-fire sound effect for a cute tower-defense game: ' + prompt + ' Dry, mobile-game mix.'} small />
          </div>
        ))}
      </div>

      {/* boss stings */}
      <h3 className="h-md" style={{ marginBottom: 14 }}>Boss stings</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 12, marginBottom: 28 }}>
        {stings.map(([i,n,prompt]) => (
          <div key={n} className="card" style={{ padding: 14 }}>
            <div className="row gap3" style={{ alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--bg-abyss)', display: 'grid', placeItems: 'center', fontSize: 17, border: '1px solid var(--bg-line)' }}>{i}</div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>{n}</span>
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{prompt}</p>
            <CopyBtn id={'sting-'+n} text={prompt} small />
          </div>
        ))}
      </div>

      {/* music */}
      <h3 className="h-md" style={{ marginBottom: 14 }}>Music tracks</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 12 }}>
        {music.map(([i,n,feel,spec,prompt,c]) => (
          <div key={n} className="card" style={{ padding: 16, borderTop: `3px solid ${c}` }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 22, lineHeight: 1, flex: '0 0 auto' }}>{i}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1.15 }}>{n}</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.3, marginTop: 3 }}>{feel}</div>
                <div className="num" style={{ fontSize: 11.5, color: c, marginTop: 7 }}>{spec}</div>
              </div>
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 12, lineHeight: 1.45 }}>{prompt}</p>
            <CopyBtn id={'mus-'+n} text={prompt} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- EXPORT ----------
function downloadText(name, text, mime){
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 1200);
}

// harvest every live sprite component into a real <symbol> atlas
function buildAtlas(){
  const out = [];
  const harvest = (id, el) => {
    const div = document.createElement('div'); div.style.cssText='position:absolute;left:-9999px;top:0';
    document.body.appendChild(div);
    const root = ReactDOM.createRoot(div);
    ReactDOM.flushSync(()=>root.render(el));
    const svg = div.querySelector('svg');
    out.push('  <symbol id="'+id+'" viewBox="'+svg.getAttribute('viewBox')+'">\n    '+svg.innerHTML.trim()+'\n  </symbol>');
    root.unmount(); div.remove();
  };
  Object.keys(TOWERS).forEach(k=>{ for(let L=1;L<=3;L++) harvest('tower-'+k+'-'+L, React.createElement(TOWERS[k].comp,{level:L})); });
  Object.keys(ENEMIES).forEach(k=>{ if(k==='dragon'){ harvest('enemy-dragon-p1', React.createElement(ENEMIES.dragon.comp,{phase:1})); harvest('enemy-dragon-p2', React.createElement(ENEMIES.dragon.comp,{phase:2})); } else harvest('enemy-'+k, React.createElement(ENEMIES[k].comp)); });
  Object.keys(TILES).forEach(k=> harvest('tile-'+k, React.createElement(TILES[k].comp)));
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!-- Bloom Bastion sprite atlas · '+out.length+' symbols · usage: <svg class="sprite"><use href="#tower-blossom-3"/></svg> -->\n'
    + '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">\n<defs>\n'
    + out.join('\n') + '\n</defs>\n</svg>\n';
}

// pull the real @keyframes out of the loaded stylesheet
async function buildKeyframes(){
  let css = '';
  try { css = await (await fetch('styles.css')).text(); } catch(e){ return '/* could not read styles.css */'; }
  const blocks = css.match(/@keyframes\s+[\w-]+\s*\{(?:[^{}]|\{[^{}]*\})*\}/g) || [];
  return '/* Bloom Bastion — animation keyframes ('+blocks.length+') */\n\n' + blocks.join('\n') + '\n';
}

function TabExport() {
  const [copied,setCopied]=React.useState('');
  const [busy,setBusy]=React.useState('');
  const copy=(text,id)=>{ navigator.clipboard?.writeText(text); setCopied(id); setTimeout(()=>setCopied(''),1200); };
  const flash=(id)=>{ setBusy(id); setTimeout(()=>setBusy(''),1400); };
  const tokens = buildTokenCSS();

  const dl = {
    tokens: () => { downloadText('design-tokens.css', buildTokenCSS(), 'text/css'); flash('tokens'); },
    atlas:  () => { downloadText('sprite-atlas.svg', buildAtlas(), 'image/svg+xml'); flash('atlas'); },
    keys:   () => { buildKeyframes().then(css=>downloadText('keyframes.css', css, 'text/css')); flash('keys'); },
  };

  return (
    <div className="section">
      <SectionHead eyebrow="Export" title="Tokens & atlas, ready to ship"
        lead="Everything here is plain CSS variables and inline SVG. Download the real files below — the atlas is harvested live from these exact components, so it’s always in sync — then drop them straight into Claude Code." />

      {/* download cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14, marginBottom:22 }}>
        {[
          ['🧩','sprite-atlas.svg','32 symbols · 18 towers + 8 enemies + 5 tiles','atlas','var(--blossom-mid)'],
          ['🎨','design-tokens.css',':root vars — colors, type, families','tokens','var(--bubble-mid)'],
          ['✨','keyframes.css','Every animation: bob, pulse, hit-flash, burst…','keys','var(--gold)'],
        ].map(([i,name,desc,key,c])=>(
          <div key={key} className="card" style={{ padding:18, borderTop:`3px solid ${c}`, display:'flex', flexDirection:'column' }}>
            <div style={{ fontSize:24 }}>{i}</div>
            <div className="mono" style={{ fontFamily:'ui-monospace,Menlo,monospace', fontWeight:700, fontSize:14, marginTop:8, color:c }}>{name}</div>
            <div className="muted" style={{ fontSize:12.5, marginTop:4, flex:1 }}>{desc}</div>
            <button onClick={dl[key]} className="btn" style={{ marginTop:14, minHeight:46, fontSize:14, color:'#1a0f2e', background:`linear-gradient(180deg, ${c}, color-mix(in oklch, ${c} 70%, #000))`, boxShadow:`0 4px 0 color-mix(in oklch, ${c} 60%, #000)` }}>
              {busy===key ? '✓ Downloaded' : '↓ Download'}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:18 }}>
        <div className="row between" style={{ padding:'14px 18px', borderBottom:'1px solid var(--bg-line)' }}>
          <span className="label">design-tokens.css · preview</span>
          <div className="row gap2">
            <button onClick={()=>copy(tokens,'css')} className="btn btn-ghost" style={{ minHeight:38, padding:'6px 16px', fontSize:13 }}>{copied==='css'?'✓ Copied':'Copy'}</button>
            <button onClick={dl.tokens} className="btn btn-ghost" style={{ minHeight:38, padding:'6px 16px', fontSize:13 }}>↓ .css</button>
          </div>
        </div>
        <pre style={{ margin:0, padding:18, overflow:'auto', maxHeight:300, fontSize:12, lineHeight:1.6, fontFamily:'ui-monospace,Menlo,monospace', color:'var(--bubble-light)', background:'var(--bg-abyss)' }}>{tokens}</pre>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="row between" style={{ padding:'14px 18px', borderBottom:'1px solid var(--bg-line)' }}>
          <span className="label">sprite-atlas.svg · symbol pattern</span>
          <button onClick={dl.atlas} className="btn btn-ghost" style={{ minHeight:38, padding:'6px 16px', fontSize:13 }}>↓ full .svg</button>
        </div>
        <pre style={{ margin:0, padding:18, overflow:'auto', maxHeight:240, fontSize:12, lineHeight:1.6, fontFamily:'ui-monospace,Menlo,monospace', color:'var(--blossom-light)', background:'var(--bg-abyss)' }}>{ATLAS_SNIPPET}</pre>
      </div>
      <p className="muted" style={{ fontSize:13, marginTop:14 }}>The downloaded atlas bundles every sprite as a <span className="code">&lt;symbol&gt;</span> in one file; reference any with <span className="code">&lt;use href="#tower-blossom-3"&gt;</span>. One request, infinitely scalable, recolorable via the token vars above.</p>
    </div>
  );
}

const ATLAS_SNIPPET = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <symbol id="tower-blossom-3" viewBox="0 0 120 150">
      <!-- pedestal + glowing core + blossom petals -->
    </symbol>
    <symbol id="enemy-dragon-p2" viewBox="0 0 100 100">
      <!-- neon serpent, phase 2 (danger red) -->
    </symbol>
    <!-- …18 towers, 8 enemies, 5 tiles, 3 props -->
  </defs>
</svg>

<!-- usage -->
<svg class="sprite"><use href="#tower-blossom-3"/></svg>`;

function buildTokenCSS() {
  const groups = [
    ['/* Backgrounds */', ['--bg-abyss','--bg-deep','--bg-stage','--bg-panel','--bg-elevated','--bg-line']],
    ['/* Blossom */', ['--blossom-light','--blossom-mid','--blossom-dark']],
    ['/* Stormcloud */', ['--storm-light','--storm-mid','--storm-dark']],
    ['/* Sugar */', ['--sugar-light','--sugar-mid','--sugar-dark']],
    ['/* Luna */', ['--luna-light','--luna-mid','--luna-dark']],
    ['/* Hive */', ['--hive-light','--hive-mid','--hive-dark']],
    ['/* Bubbler */', ['--bubble-light','--bubble-mid','--bubble-dark']],
    ['/* HUD + HP */', ['--gold','--gold-deep','--danger','--success','--hp-high','--hp-mid','--hp-low']],
  ];
  const cs = getComputedStyle(document.documentElement);
  let out = ':root {\n';
  for (const [comment, vars] of groups) {
    out += `  ${comment}\n`;
    for (const v of vars) out += `  ${v}: ${cs.getPropertyValue(v).trim()};\n`;
  }
  out += `\n  /* Type */\n  --font-display: 'Baloo 2', sans-serif;\n  --font-body: 'Nunito', sans-serif;\n}`;
  return out;
}

Object.assign(window, { TabScreens, TabSound, TabExport });
