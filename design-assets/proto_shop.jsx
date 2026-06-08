/* global React, TOWERS */
// ============================================================
// BLOOM BASTION — Shop / meta-progression
// Persistent gems · tower skins · permanent upgrades.
// Exposes window.BBShop (data + persistence) and window.ShopScreen (UI).
// ============================================================
(function () {
  const LS = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  // ---- tower skins (color overrides for --<family>-light/mid/dark) ----
  const SKINS = {
    blossom: [ { id: 'sakura', name: 'Sakura', cost: 0, c: ['#ffd6e8', '#ff6fa5', '#c43d77'] }, { id: 'midnight', name: 'Midnight', cost: 25, c: ['#d8c8ff', '#8a6dff', '#5b3fb0'] }, { id: 'ember', name: 'Ember', cost: 55, c: ['#ffd9b0', '#ff7a3d', '#c2451a'] } ],
    storm:   [ { id: 'sky', name: 'Sky', cost: 0, c: ['#d2ecff', '#5db8ff', '#2a6fae'] }, { id: 'voltage', name: 'Voltage', cost: 25, c: ['#fff2a8', '#ffd633', '#c79a00'] }, { id: 'toxic', name: 'Toxic', cost: 55, c: ['#d4ffb0', '#7ee03f', '#3f9e1f'] } ],
    sugar:   [ { id: 'coral', name: 'Coral', cost: 0, c: ['#ffd9d2', '#ff7a6b', '#d6463a'] }, { id: 'grape', name: 'Grape', cost: 25, c: ['#e6c8ff', '#a85cff', '#6b2fb0'] }, { id: 'mint', name: 'Mint', cost: 55, c: ['#c6fff0', '#4fe0c4', '#1f9e85'] } ],
    luna:    [ { id: 'lavender', name: 'Lavender', cost: 0, c: ['#e6dcff', '#b388ff', '#7a4fd6'] }, { id: 'rose', name: 'Rose', cost: 25, c: ['#ffd6e8', '#ff6fa5', '#c43d77'] }, { id: 'solar', name: 'Solar', cost: 55, c: ['#ffe88a', '#ffd700', '#d9a400'] } ],
    hive:    [ { id: 'honey', name: 'Honey', cost: 0, c: ['#ffe9b0', '#ffb74d', '#e07b1f'] }, { id: 'crimson', name: 'Crimson', cost: 25, c: ['#ffc8c8', '#ff5d5d', '#c22a2a'] }, { id: 'jade', name: 'Jade', cost: 55, c: ['#c6ffe0', '#3fe07a', '#1f9e54'] } ],
    bubble:  [ { id: 'aqua', name: 'Aqua', cost: 0, c: ['#c6fff0', '#4fe0c4', '#1f9e85'] }, { id: 'sunset', name: 'Sunset', cost: 25, c: ['#ffd9b0', '#ff8a5c', '#d6543a'] }, { id: 'violet', name: 'Violet', cost: 55, c: ['#e6dcff', '#b388ff', '#7a4fd6'] } ],
  };
  const PERKS = [
    { id: 'gold', name: 'Starting Treasury', icon: '💰', desc: '+60 starting gold', unit: 60, max: 5, base: 20, step: 15 },
    { id: 'lives', name: 'Fortified Walls', icon: '🛡️', desc: '+3 starting lives', unit: 3, max: 5, base: 25, step: 15 },
    { id: 'interest', name: 'Compound Interest', icon: '🏦', desc: '+3% wave interest', unit: 0.03, max: 5, base: 30, step: 20 },
    { id: 'refund', name: 'Fair Trade', icon: '♻️', desc: '+8% sell refund', unit: 0.08, max: 3, base: 35, step: 25 },
  ];

  let GEMS = +(localStorage.getItem('bb_gems') || 0);
  let OWNED = LS.get('bb_owned', {});          // {family:[ids]}
  let EQUIP = LS.get('bb_skins', {});          // {family:id}
  let PLVL = LS.get('bb_perks', {});           // {perkId:level}
  Object.keys(SKINS).forEach(f => { if (!EQUIP[f]) EQUIP[f] = SKINS[f][0].id; });

  const skin = (f, id) => (SKINS[f] || []).find(s => s.id === id);
  const isOwned = (f, id) => { const s = skin(f, id); return (s && s.cost === 0) || (OWNED[f] || []).includes(id); };
  const perkLevel = (id) => PLVL[id] || 0;
  const perkCost = (p) => p.base + perkLevel(p.id) * p.step;

  const BBShop = {
    SKINS, PERKS,
    getGems() { return GEMS; },
    addGems(n) { GEMS += n; localStorage.setItem('bb_gems', GEMS); },
    spendGems(n) { if (GEMS < n) return false; GEMS -= n; localStorage.setItem('bb_gems', GEMS); return true; },
    isOwned, equipped: (f) => EQUIP[f], perkLevel, perkCost,
    buySkin(f, id) { const s = skin(f, id); if (!s || isOwned(f, id)) return false; if (!BBShop.spendGems(s.cost)) return false; (OWNED[f] = OWNED[f] || []).push(id); LS.set('bb_owned', OWNED); BBShop.equip(f, id); return true; },
    equip(f, id) { if (!isOwned(f, id)) return false; EQUIP[f] = id; LS.set('bb_skins', EQUIP); return true; },
    buyPerk(p) { const lv = perkLevel(p.id); if (lv >= p.max) return false; if (!BBShop.spendGems(perkCost(p))) return false; PLVL[p.id] = lv + 1; LS.set('bb_perks', PLVL); return true; },
    perkStats() { return { gold: 60 * perkLevel('gold'), lives: 3 * perkLevel('lives'), interest: 0.03 * perkLevel('interest'), refund: 0.08 * perkLevel('refund') }; },
    // CSS-var overrides for the equipped skin of a family
    skinVars(f) { const s = skin(f, EQUIP[f]); if (!s) return {}; const o = {}; o['--' + f + '-light'] = s.c[0]; o['--' + f + '-mid'] = s.c[1]; o['--' + f + '-dark'] = s.c[2]; return o; },
  };
  window.BBShop = BBShop;

  // ---------- UI ----------
  function ShopScreen({ onClose }) {
    const [tab, setTab] = React.useState('skins');
    const [, force] = React.useReducer(x => x + 1, 0);
    const gems = BBShop.getGems();
    const TG = (type, level) => { const C = TOWERS[type].comp; return <C level={level} />; };

    const Backdrop = (props) => <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 2700, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.8)', backdropFilter: 'blur(4px)', padding: 16 }}>{props.children}</div>;

    return (
      <Backdrop>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, maxHeight: 'calc(100% - 12px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-line)', flex: '0 0 auto', background: 'linear-gradient(180deg, rgba(14,8,32,.5), transparent)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>🛒 Shop</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="num" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 15, color: 'var(--luna-light)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 99, padding: '5px 13px' }}>💎 {gems}</span>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </div>
          {/* tabs */}
          <div style={{ display: 'flex', gap: 6, padding: '10px 16px 0', flex: '0 0 auto' }}>
            {[['skins', '🎨 Tower Skins'], ['perks', '⚡ Upgrades']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13.5, padding: '9px 10px', borderRadius: 'var(--r-md)', cursor: 'pointer', border: '1px solid var(--bg-line)', color: tab === k ? '#1a0f2e' : 'var(--text-soft)', background: tab === k ? 'linear-gradient(180deg,var(--gold),var(--gold-deep))' : 'var(--bg-panel)' }}>{l}</button>
            ))}
          </div>
          {/* body */}
          <div style={{ overflowY: 'auto', padding: '14px 16px 18px' }}>
            {tab === 'skins' && Object.keys(BBShop.SKINS).map(fam => (
              <div key={fam} style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: `var(--${fam}-mid)`, marginBottom: 7 }}>{TOWERS[fam].emoji} {TOWERS[fam].name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {BBShop.SKINS[fam].map(s => {
                    const owned = BBShop.isOwned(fam, s.id); const eq = BBShop.equipped(fam) === s.id;
                    const onClick = () => { if (eq) return; if (owned) BBShop.equip(fam, s.id); else { if (!BBShop.buySkin(fam, s.id)) return; } force(); };
                    return (
                      <button key={s.id} onClick={onClick} style={{ position: 'relative', padding: '8px 8px 9px', borderRadius: 'var(--r-md)', cursor: eq ? 'default' : 'pointer', textAlign: 'center', background: eq ? 'var(--bg-elevated)' : 'var(--bg-panel)', border: `1.5px solid ${eq ? s.c[1] : 'var(--bg-line)'}`, boxShadow: eq ? `0 0 12px -4px ${s.c[1]}` : 'none' }}>
                        {eq && <div style={{ position: 'absolute', top: 6, right: 6, width: 17, height: 17, borderRadius: '50%', background: s.c[1], color: '#1a0f2e', fontSize: 10, fontWeight: 800, display: 'grid', placeItems: 'center' }}>✓</div>}
                        <div style={{ height: 38, display: 'grid', placeItems: 'end center' }}><div style={{ width: 30, ['--' + fam + '-light']: s.c[0], ['--' + fam + '-mid']: s.c[1], ['--' + fam + '-dark']: s.c[2] }}>{TG(fam, 2)}</div></div>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: 'var(--text-bright)', marginTop: 5 }}>{s.name}</div>
                        <div className="num" style={{ fontSize: 10.5, marginTop: 2, color: eq ? 'var(--success)' : owned ? 'var(--text-dim)' : 'var(--luna-light)' }}>{eq ? 'Equipped' : owned ? 'Owned' : '💎 ' + s.cost}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {tab === 'perks' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {BBShop.PERKS.map(p => {
                  const lv = BBShop.perkLevel(p.id); const maxed = lv >= p.max; const cost = BBShop.perkCost(p); const can = gems >= cost && !maxed;
                  const buy = () => { if (BBShop.buyPerk(p)) force(); };
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--bg-panel)', border: '1px solid var(--bg-line)' }}>
                      <span style={{ fontSize: 24, flex: '0 0 auto' }}>{p.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>{p.name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{p.desc} <span style={{ color: 'var(--text-soft)' }}>· per level</span></div>
                        <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>{Array.from({ length: p.max }).map((_, i) => <div key={i} style={{ width: 18, height: 6, borderRadius: 99, background: i < lv ? 'var(--gold)' : 'var(--bg-abyss)', border: '1px solid var(--bg-line)' }} />)}</div>
                      </div>
                      <button onClick={buy} disabled={!can} style={{ flex: '0 0 auto', minWidth: 76, padding: '9px 12px', borderRadius: 99, border: 0, cursor: can ? 'pointer' : 'default', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12.5, color: maxed ? 'var(--text-dim)' : can ? '#2a1d00' : 'var(--text-dim)', background: maxed ? 'var(--bg-elevated)' : can ? 'linear-gradient(180deg,#ffe88a,var(--gold))' : 'var(--bg-abyss)', whiteSpace: 'nowrap' }}>{maxed ? 'MAX' : '💎 ' + cost}</button>
                    </div>
                  );
                })}
                <p className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 4 }}>Earn 💎 by clearing waves. Upgrades apply to every run.</p>
              </div>
            )}
          </div>
        </div>
      </Backdrop>
    );
  }
  window.ShopScreen = ShopScreen;
})();
