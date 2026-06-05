/* global React, ReactDOM, TOWERS,
   TabOverview, TabColors, TabType, TabTowers, TabEnemies, TabHUD, TabMap, TabFX, TabScreens, TabSound, TabExport */
// ============================================================
// BLOOM BASTION — App shell + tab navigation
// ============================================================
const { useState: useStateA, useEffect: useEffectA } = React;

const TABS = [
  { id:'overview', label:'Overview', dot:'var(--gold)' },
  { id:'colors',   label:'Colors',   dot:'var(--blossom-mid)' },
  { id:'type',     label:'Type',     dot:'var(--bubble-mid)' },
  { id:'towers',   label:'Towers',   dot:'var(--luna-mid)' },
  { id:'enemies',  label:'Enemies',  dot:'var(--success)' },
  { id:'bosses',   label:'Bosses',   dot:'var(--danger)' },
  { id:'hud',      label:'HUD',      dot:'var(--storm-mid)' },
  { id:'map',      label:'Map',      dot:'var(--hive-mid)' },
  { id:'biomes',   label:'Biomes',   dot:'var(--bubble-mid)' },
  { id:'fx',       label:'FX & Juice', dot:'var(--danger)' },
  { id:'screens',  label:'Screens',  dot:'var(--sugar-mid)' },
  { id:'sound',    label:'Sound',    dot:'var(--luna-light)' },
  { id:'access',   label:'Access',   dot:'var(--success)' },
  { id:'export',   label:'Export',   dot:'var(--gold)' },
];

const PANELS = {
  overview: TabOverview, colors: TabColors, type: TabType, towers: TabTowers,
  enemies: TabEnemies, bosses: TabBosses, hud: TabHUD, map: TabMap, biomes: TabBiomes,
  fx: TabFX, screens: TabScreens, sound: TabSound, access: TabAccess, export: TabExport,
};

function BrandGlyph() {
  const TB = TOWERS.blossom.comp;
  return <div className="brand-glyph"><TB level={3} /></div>;
}

function App() {
  const [tab, setTab] = useStateA(() => (location.hash || '#overview').slice(1));
  useEffectA(() => { location.hash = tab; window.scrollTo({ top: 0 }); }, [tab]);
  const Panel = PANELS[tab] || TabOverview;
  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <BrandGlyph />
            <div>
              <div className="brand-name"><span className="a">Bloom</span> <span className="b">Bastion</span></div>
              <div className="brand-tag">Tower Defense · Visual Bible</div>
            </div>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map(t => (
            <button key={t.id} className={`tab ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
              {tab!==t.id && <span className="dot" style={{ background: t.dot }} />}{t.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="shell">
        <Panel key={tab} go={setTab} />
      </main>
      <footer style={{ borderTop:'1px solid var(--bg-line)', marginTop:48 }}>
        <div className="shell" style={{ paddingTop:24, paddingBottom:32 }}>
          <div className="row between wrap gap4">
            <div className="row gap2"><BrandGlyph /><span style={{ fontFamily:'var(--font-display)', fontWeight:800 }}>Bloom Bastion</span><span className="muted" style={{ fontSize:13 }}>· cute but deadly</span></div>
            <span className="muted" style={{ fontSize:12.5 }}>Flat-vector + glow design system · v1 · {TABS.length} tabs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
