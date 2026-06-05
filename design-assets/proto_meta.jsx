/* global React */
// ============================================================
// BLOOM BASTION — Achievements + Daily Challenge
// window.BBAch (tracking + AchievementsScreen) · window.BBDaily
// ============================================================
(function () {
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  // ---------- ACHIEVEMENTS ----------
  const ACH = [
    { id: 'first', icon: '🌱', name: 'First Bloom', desc: 'Clear your first wave' },
    { id: 'sprout', icon: '🥉', name: 'Sprout Slayer', desc: 'Win a run on Sprout' },
    { id: 'bloom', icon: '🥈', name: 'Bloom Champion', desc: 'Win a run on Bloom' },
    { id: 'bastion', icon: '🥇', name: 'Bastion Breaker', desc: 'Beat the Neon Dragon (Bastion)' },
    { id: 'flawless', icon: '💎', name: 'Untouchable', desc: 'Win without losing a life' },
    { id: 'maxed', icon: '⬆️', name: 'Fully Bloomed', desc: 'Upgrade a tower to Lv.3' },
    { id: 'rich', icon: '🤑', name: 'Tycoon', desc: 'Hold 1,000 gold at once' },
    { id: 'combo', icon: '🔥', name: 'Unstoppable', desc: 'Reach a ×20 combo' },
    { id: 'biomes', icon: '🌍', name: 'Globetrotter', desc: 'Win on all three biomes' },
    { id: 'endless', icon: '♾️', name: 'Endless Warrior', desc: 'Reach wave 10 in Endless' },
  ];
  let UN = load('bb_ach', {});
  let ST = load('bb_stats', { wins: {}, biomes: {} });
  ST.wins = ST.wins || {}; ST.biomes = ST.biomes || {};

  function evalAll() {
    const u = {
      first: !!ST.firstWave, sprout: !!ST.wins.sprout, bloom: !!ST.wins.bloom, bastion: !!ST.wins.bastion,
      flawless: !!ST.flawless, maxed: !!ST.maxedTower, rich: (ST.maxGold || 0) >= 1000, combo: (ST.maxCombo || 0) >= 20,
      biomes: ST.biomes.meadow && ST.biomes.frost && ST.biomes.ember, endless: (ST.endlessWave || 0) >= 10,
    };
    const fresh = [];
    ACH.forEach(a => { if (u[a.id] && !UN[a.id]) { UN[a.id] = Date.now(); fresh.push(a); } });
    if (fresh.length) { save('bb_ach', UN); fresh.forEach(a => { try { window.dispatchEvent(new CustomEvent('bb-ach', { detail: a })); } catch (e) {} }); }
  }
  window.BBAch = {
    ACH, isUnlocked: (id) => !!UN[id], count: () => ACH.filter(a => UN[a.id]).length, total: () => ACH.length,
    note(type, d) {
      if (type === 'waveClear') ST.firstWave = true;
      else if (type === 'win') { ST.wins[d.diff] = true; ST.biomes[d.biome] = true; if (d.flawless) ST.flawless = true; }
      else if (type === 'combo') ST.maxCombo = Math.max(ST.maxCombo || 0, d);
      else if (type === 'gold') ST.maxGold = Math.max(ST.maxGold || 0, d);
      else if (type === 'maxTower') ST.maxedTower = true;
      else if (type === 'endless') ST.endlessWave = Math.max(ST.endlessWave || 0, d);
      save('bb_stats', ST); evalAll();
    },
  };

  // ---------- DAILY CHALLENGE ----------
  window.BBDaily = {
    today() { return new Date().toISOString().slice(0, 10); },
    seed() { const s = this.today(); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; },
    config() {
      const h = this.seed(); const maps = ['meadow', 'frost', 'ember']; const diffs = ['sprout', 'bloom']; const towers = ['blossom', 'storm', 'sugar', 'luna', 'hive', 'bubble'];
      const lo = []; let x = h; while (lo.length < 4) { const t = towers[x % 6]; if (!lo.includes(t)) lo.push(t); x = (x * 1103515245 + 12345) >>> 0; }
      return { map: maps[h % 3], diff: diffs[(h >> 2) % 2], loadout: lo };
    },
    best() { return +(localStorage.getItem('bb_daily_' + this.today()) || 0); },
    setBest(score) { const k = 'bb_daily_' + this.today(); if (score > this.best()) localStorage.setItem(k, score); },
  };

  // ---------- ACHIEVEMENTS SCREEN ----------
  function AchScreen({ onClose }) {
    const got = window.BBAch.count(), tot = window.BBAch.total();
    return (
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 2700, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.8)', backdropFilter: 'blur(4px)', padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 540, maxHeight: 'calc(100% - 12px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--bg-line)', background: 'linear-gradient(180deg, rgba(14,8,32,.5), transparent)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>🏆 Achievements</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="num" style={{ fontSize: 14, color: 'var(--gold)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 99, padding: '5px 12px' }}>{got}/{tot}</span>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          </div>
          <div style={{ overflowY: 'auto', padding: 14, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
            {window.BBAch.ACH.map(a => { const on = window.BBAch.isUnlocked(a.id); return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 'var(--r-md)', background: on ? 'var(--bg-elevated)' : 'var(--bg-panel)', border: `1px solid ${on ? 'var(--gold-deep)' : 'var(--bg-line)'}`, opacity: on ? 1 : 0.6 }}>
                <span style={{ fontSize: 26, flex: '0 0 auto', filter: on ? 'none' : 'grayscale(1)' }}>{on ? a.icon : '🔒'}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13.5, color: on ? 'var(--gold)' : 'var(--text-soft)' }}>{a.name}</div>
                  <div className="muted" style={{ fontSize: 11, lineHeight: 1.3 }}>{a.desc}</div>
                </div>
              </div>
            ); })}
          </div>
        </div>
      </div>
    );
  }
  window.AchScreen = AchScreen;

  // ---------- ACHIEVEMENT TOAST ----------
  function AchToast() {
    const [q, setQ] = React.useState([]);
    React.useEffect(() => {
      const on = (e) => { const a = e.detail; setQ(x => [...x, a]); setTimeout(() => setQ(x => x.filter(i => i !== a)), 3600); };
      window.addEventListener('bb-ach', on); return () => window.removeEventListener('bb-ach', on);
    }, []);
    if (!q.length) return null;
    return (
      <div style={{ position: 'absolute', top: 64, left: '50%', transform: 'translateX(-50%)', zIndex: 4000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none', width: 'max-content', maxWidth: '90%' }}>
        {q.map((a, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', borderRadius: 99, background: 'linear-gradient(180deg,#ffe88a,var(--gold))', color: '#2a1d00', boxShadow: '0 8px 24px -6px rgba(0,0,0,.6)', animation: 'achPop .4s cubic-bezier(.34,1.56,.64,1)' }}>
            <span style={{ fontSize: 24 }}>{a.icon}</span>
            <div>
              <div className="num" style={{ fontSize: 9.5, letterSpacing: '.18em', opacity: .7 }}>ACHIEVEMENT UNLOCKED</div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>{a.name}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  window.AchToast = AchToast;

  // ---------- ACCOUNT (link to sync progress) ----------
  let ACC = load('bb_account', null);
  const PROVIDERS = { google: { label: 'Google', icon: 'G', color: '#4285F4', email: 'poppy@gmail.com', name: 'Poppy Bloom' }, apple: { label: 'Apple', icon: '', color: '#e8e8ee', email: 'poppy@icloud.com', name: 'Poppy Bloom' } };
  window.BBAccount = {
    get() { return ACC; },
    link(provider, email, name) { const p = PROVIDERS[provider] || {}; ACC = { provider, label: p.label || 'Email', email: email || p.email || 'player@bloom.gg', name: name || p.name || 'Bloom Player', since: Date.now() }; save('bb_account', ACC); return ACC; },
    signOut() { ACC = null; try { localStorage.removeItem('bb_account'); } catch (e) {} },
  };

  function AccountScreen({ onClose }) {
    const [, force] = React.useReducer(x => x + 1, 0);
    const [mode, setMode] = React.useState(null);     // null | 'email'
    const [email, setEmail] = React.useState('');
    const [syncing, setSyncing] = React.useState(false);
    const acc = window.BBAccount.get();
    const doLink = (provider, em) => { setSyncing(true); setTimeout(() => { window.BBAccount.link(provider, em); setSyncing(false); setMode(null); force(); }, 700); };
    const stat = (label, val) => (
      <div style={{ flex: 1, textAlign: 'center', background: 'var(--bg-abyss)', borderRadius: 'var(--r-md)', padding: '10px 6px', border: '1px solid var(--bg-line)' }}>
        <div className="num" style={{ fontSize: 17, fontWeight: 800, color: 'var(--gold)' }}>{val}</div>
        <div className="num" style={{ fontSize: 8.5, letterSpacing: '.1em', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
      </div>
    );
    const Provider = ({ id, label, icon, bg, fg }) => (
      <button onClick={() => doLink(id)} disabled={syncing} className="row center gap2" style={{ width: '100%', minHeight: 48, borderRadius: 'var(--r-md)', cursor: 'pointer', border: '1px solid var(--bg-line)', background: bg, color: fg, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 16 }}>{icon}</span> Continue with {label}
      </button>
    );
    return (
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 3400, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.82)', backdropFilter: 'blur(4px)', padding: 16 }}>
        <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 340, borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden' }}>
          <div className="row between" style={{ padding: '14px 16px', borderBottom: '1px solid var(--bg-line)', background: 'linear-gradient(180deg, rgba(14,8,32,.5), transparent)' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19 }}>☁️ Account</span>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          <div style={{ padding: '18px 18px 20px' }}>
            {acc ? (
              <React.Fragment>
                <div className="row gap3" style={{ alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', flex: '0 0 auto', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#1a0f2e', background: 'linear-gradient(180deg,var(--blossom-light),var(--blossom-mid))', boxShadow: '0 0 14px -4px var(--blossom-mid)' }}>{(acc.name || 'B')[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>{acc.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{acc.email}</div>
                    <div className="num" style={{ fontSize: 10, color: 'var(--success)', marginTop: 3 }}>✓ Synced via {acc.label}</div>
                  </div>
                </div>
                <div className="num" style={{ fontSize: 9.5, letterSpacing: '.18em', color: 'var(--luna-mid)', textTransform: 'uppercase', margin: '0 2px 7px' }}>Synced to cloud</div>
                <div className="row gap2" style={{ marginBottom: 16 }}>
                  {stat('Gems', window.BBShop ? window.BBShop.getGems() : 0)}
                  {stat('Awards', (window.BBAch ? window.BBAch.count() : 0) + '/' + (window.BBAch ? window.BBAch.total() : 10))}
                  {stat('Best wave', +(localStorage.getItem('bb_best') || 0))}
                </div>
                <button onClick={() => { window.BBAccount.signOut(); force(); }} className="btn btn-ghost" style={{ width: '100%', minHeight: 46, color: 'var(--danger)' }}>Sign out</button>
              </React.Fragment>
            ) : syncing ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 38, height: 38, margin: '0 auto', borderRadius: '50%', border: '3px solid var(--bg-line)', borderTopColor: 'var(--blossom-mid)', animation: 'spin-slow .8s linear infinite' }} />
                <div className="num" style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 12 }}>Linking & syncing…</div>
              </div>
            ) : mode === 'email' ? (
              <React.Fragment>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Sign in with email</div>
                <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>We'll send a magic link to keep your progress safe.</p>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', minHeight: 46, borderRadius: 'var(--r-md)', border: '1px solid var(--bg-line)', background: 'var(--bg-abyss)', color: 'var(--text-bright)', padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: 15, marginBottom: 10 }} />
                <button onClick={() => email.includes('@') && doLink('email', email)} disabled={!email.includes('@')} className="btn btn-primary" style={{ width: '100%', minHeight: 48, opacity: email.includes('@') ? 1 : .5 }}>Send magic link</button>
                <button onClick={() => setMode(null)} className="btn btn-ghost" style={{ width: '100%', minHeight: 42, marginTop: 8, fontSize: 13 }}>← Back</button>
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="muted" style={{ fontSize: 13, lineHeight: 1.5, textAlign: 'center', marginBottom: 16 }}>Link an account to <b style={{ color: 'var(--text-soft)' }}>sync your gems, skins, achievements & scores</b> across devices.</p>
                <div className="col gap2">
                  <Provider id="google" label="Google" icon="🔵" bg="#fff" fg="#1a0f2e" />
                  <Provider id="apple" label="Apple" icon="" bg="#1a1a22" fg="#fff" />
                  <button onClick={() => setMode('email')} className="row center gap2" style={{ width: '100%', minHeight: 48, borderRadius: 'var(--r-md)', cursor: 'pointer', border: '1px solid var(--bg-line)', background: 'var(--bg-elevated)', color: 'var(--text-bright)', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5, whiteSpace: 'nowrap' }}>✉️ Continue with email</button>
                </div>
                <button onClick={onClose} className="btn btn-ghost" style={{ width: '100%', minHeight: 42, marginTop: 12, fontSize: 13, color: 'var(--text-dim)' }}>Maybe later</button>
                <div className="num" style={{ fontSize: 10, color: 'var(--text-faint)', textAlign: 'center', marginTop: 12 }}>Your progress is saved on this device either way.</div>
              </React.Fragment>
            )}
          </div>
        </div>
      </div>
    );
  }
  window.AccountScreen = AccountScreen;
})();
