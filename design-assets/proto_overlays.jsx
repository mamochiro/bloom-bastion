/* global React, TOWERS, ENEMIES */
// ============================================================
// BLOOM BASTION — Prototype overlays
// Loadout gate · Pause menu · Settings panel (all interactive)
// ============================================================
const { useState: useStateO } = React;

// ---------- SETTINGS PERSISTENCE ----------
const DEFAULT_SETTINGS = { music: 68, sfx: 85, musicOn: true, sfxOn: true, haptics: true, shake: true, reduced: false, notif: true, lang: 'English' };
const LANGS = ['English', 'ไทย', '日本語', 'Español', 'Deutsch'];
function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('bb_settings') || '{}') }; }
  catch (e) { return { ...DEFAULT_SETTINGS }; }
}
function saveSettings(s) { try { localStorage.setItem('bb_settings', JSON.stringify(s)); } catch (e) {} }

// ---------- SHARED PRIMITIVES ----------
function OverlayBackdrop({ children, z = 3000, onClick }) {
  return (
    <div onClick={onClick} style={{ position: 'absolute', inset: 0, zIndex: z, display: 'grid', placeItems: 'center', background: 'rgba(8,5,18,.78)', backdropFilter: 'blur(4px)', padding: 18 }}>
      {children}
    </div>
  );
}
function Panel({ children, width = 340, style }) {
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: width, maxHeight: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column', borderRadius: 'var(--r-xl)', background: 'linear-gradient(180deg,var(--bg-panel),var(--bg-stage))', border: '1px solid var(--bg-line)', boxShadow: 'var(--shadow-panel)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}
// shared chunky menu button
function MBtn({ kind, children, onClick, style }) {
  const cls = kind === 'primary' ? 'btn-primary' : kind === 'gold' ? 'btn-gold' : 'btn-ghost';
  return <button onClick={onClick} className={`btn ${cls}`} style={{ width: '100%', fontSize: 16, minHeight: 50, ...style }}>{children}</button>;
}

// ---------- INTERACTIVE PILL TOGGLE ----------
function PToggle({ on, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={on} style={{ width: 46, height: 27, borderRadius: 99, padding: 3, display: 'flex', alignItems: 'center', justifyContent: on ? 'flex-end' : 'flex-start', cursor: 'pointer',
      background: on ? 'linear-gradient(180deg,var(--success),#2aa866)' : 'var(--bg-abyss)',
      border: `1px solid ${on ? '#2aa866' : 'var(--bg-line)'}`,
      boxShadow: on ? '0 0 10px -2px var(--success)' : 'inset 0 1px 2px rgba(0,0,0,.4)' }}>
      <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff6ff', boxShadow: '0 1px 3px rgba(0,0,0,.5)' }} />
    </button>
  );
}
// interactive volume slider (native range, cute styling via .bb-range)
function PSlider({ value, color, onChange }) {
  return (
    <input type="range" min="0" max="100" value={value} onChange={(e) => onChange(+e.target.value)} className="bb-range"
      style={{ width: 120, background: `linear-gradient(90deg, ${color} 0 ${value}%, var(--bg-abyss) ${value}% 100%)` }} />
  );
}
// a settings row
function SRow({ icon, label, sub, right, last }) {
  return (
    <div className="row between" style={{ padding: '11px 13px', gap: 10, borderBottom: last ? 'none' : '1px solid var(--bg-line)' }}>
      <div className="row gap3" style={{ alignItems: 'center', minWidth: 0 }}>
        <span style={{ fontSize: 16, width: 20, textAlign: 'center', flex: '0 0 auto' }}>{icon}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--text-bright)', whiteSpace: 'nowrap' }}>{label}</div>
          {sub && <div className="muted" style={{ fontSize: 11 }}>{sub}</div>}
        </div>
      </div>
      <div style={{ flex: '0 0 auto' }}>{right}</div>
    </div>
  );
}
function SGroup({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--luna-mid)', margin: '0 4px 7px' }}>{title}</div>
      <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--bg-line)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// ---------- SETTINGS PANEL ----------
function SettingsPanel({ settings, onChange, onClose, onAccount }) {
  const set = (k, v) => onChange({ [k]: v });
  const acc = (window.BBAccount && window.BBAccount.get && window.BBAccount.get()) || null;
  return (
    <OverlayBackdrop z={3200} onClick={onClose}>
      <Panel width={366}>
        <div className="row between" style={{ padding: '15px 16px', borderBottom: '1px solid var(--bg-line)', flex: '0 0 auto', background: 'linear-gradient(180deg, rgba(14,8,32,.5), transparent)' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 19 }}>⚙ Settings</span>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 14 }}>✕</button>
        </div>
        <div style={{ overflowY: 'auto', padding: '14px 14px 16px' }}>
          <SGroup title="Audio">
            <SRow icon="🎵" label="Music" right={<PSlider value={settings.music} color="var(--bubble-mid)" onChange={(v) => set('music', v)} />} />
            <SRow icon="🔊" label="Sound FX" right={<PSlider value={settings.sfx} color="var(--blossom-mid)" onChange={(v) => set('sfx', v)} />} last />
          </SGroup>
          <SGroup title="Gameplay">
            <SRow icon="📳" label="Haptics" sub="Vibrate on hits" right={<PToggle on={settings.haptics} onClick={() => set('haptics', !settings.haptics)} />} />
            <SRow icon="💥" label="Screen shake" sub="Camera kick on damage" right={<PToggle on={settings.shake} onClick={() => set('shake', !settings.shake)} />} />
            <SRow icon="🌀" label="Reduced motion" sub="Fewer particles & bursts" right={<PToggle on={settings.reduced} onClick={() => set('reduced', !settings.reduced)} />} last />
          </SGroup>
          <SGroup title="General">
            <SRow icon="🌐" label="Language" right={
              <button onClick={() => set('lang', LANGS[(LANGS.indexOf(settings.lang) + 1) % LANGS.length])} className="num row gap2" style={{ alignItems: 'center', fontSize: 13, color: 'var(--text-soft)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}>{settings.lang}<span style={{ color: 'var(--text-dim)', fontSize: 14 }}>⇄</span></button>
            } />
            <SRow icon="🔔" label="Notifications" sub="Daily bloom reward" right={<PToggle on={settings.notif} onClick={() => set('notif', !settings.notif)} />} last />
          </SGroup>
          <SGroup title="Account">
            <SRow icon="☁️" label={acc ? acc.name : 'Cloud save'} sub={acc ? acc.email : 'Sync across devices'} right={<button onClick={() => onAccount && onAccount()} className="num" style={{ fontSize: 12, color: acc ? 'var(--success)' : 'var(--bubble-mid)', background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}>{acc ? '✓ Linked' : 'Link →'}</button>} last />
          </SGroup>
          <div className="num" style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>Bloom Bastion · v1.0.3 · prototype</div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- PAUSE MENU ----------
function PauseMenu({ wave, enemiesLeft, settings, onResume, onRestart, onSettings, onQuit, onQuick }) {
  const Btn = ({ kind, children, onClick, danger }) => {
    const cls = kind === 'primary' ? 'btn-primary' : kind === 'gold' ? 'btn-gold' : 'btn-ghost';
    return <button onClick={onClick} className={`btn ${cls}`} style={{ width: '100%', fontSize: 15, minHeight: 48, padding: '11px 18px', ...(danger ? { color: 'var(--danger)', borderColor: 'color-mix(in oklch, var(--danger) 45%, var(--bg-line))' } : {}) }}>{children}</button>;
  };
  const Quick = ({ icon, on, label, k }) => (
    <button onClick={() => onQuick(k)} className="col center" style={{ gap: 4, background: 'none', border: 0, cursor: 'pointer' }}>
      <div style={{ width: 46, height: 46, borderRadius: 13, display: 'grid', placeItems: 'center', fontSize: 18, position: 'relative',
        background: on ? 'var(--bg-elevated)' : 'var(--bg-abyss)', border: `1.5px solid ${on ? 'var(--bubble-mid)' : 'var(--bg-line)'}`,
        color: on ? 'var(--bubble-mid)' : 'var(--text-faint)', boxShadow: on ? '0 0 12px -3px var(--bubble-mid)' : 'none', opacity: on ? 1 : .7 }}>
        {icon}
        {!on && <div style={{ position: 'absolute', width: 32, height: 2, background: 'var(--danger)', transform: 'rotate(-45deg)', borderRadius: 2, boxShadow: '0 0 4px var(--danger)' }} />}
      </div>
      <span className="num" style={{ fontSize: 9, letterSpacing: '.08em', color: on ? 'var(--text-dim)' : 'var(--text-faint)', textTransform: 'uppercase' }}>{label}</span>
    </button>
  );
  return (
    <OverlayBackdrop z={3000} onClick={onResume}>
      <Panel width={236} style={{ overflow: 'visible' }}>
        <div style={{ padding: '20px 18px 18px', textAlign: 'center' }}>
          <div className="num" style={{ fontSize: 10, letterSpacing: '.28em', color: 'var(--text-dim)' }}>WAVE {wave} · {enemiesLeft} LEFT</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, letterSpacing: '.05em', lineHeight: 1, marginTop: 3, textShadow: '0 0 18px rgba(179,136,255,.55)' }}>PAUSED</div>
          <div className="col gap2" style={{ marginTop: 16 }}>
            <Btn kind="primary" onClick={onResume}>▶ Resume</Btn>
            <Btn kind="gold" onClick={onRestart}>↻ Restart wave</Btn>
            <Btn onClick={onSettings}>⚙ Settings</Btn>
            <Btn danger onClick={onQuit}>⌂ Quit to menu</Btn>
          </div>
          <div className="row center gap5" style={{ marginTop: 16, paddingTop: 15, borderTop: '1px solid var(--bg-line)' }}>
            <Quick icon="🎵" on={settings.musicOn} label="Music" k="musicOn" />
            <Quick icon="🔊" on={settings.sfxOn} label="SFX" k="sfxOn" />
          </div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- LOADOUT GATE ----------
function LoadoutOverlay({ initial, onConfirm, onBack }) {
  const MAX = 4;
  const AIR = ['luna', 'storm', 'hive'];
  const [picked, setPicked] = useStateO(() => initial || ['blossom', 'storm', 'sugar', 'bubble']);
  const toggle = (k) => setPicked((p) => p.includes(k) ? p.filter((x) => x !== k) : (p.length >= MAX ? p : [...p, k]));
  const keys = Object.keys(TOWERS);
  const hasAir = picked.some((k) => AIR.includes(k));
  return (
    <OverlayBackdrop z={2600}>
      <Panel width={560} style={{ background: 'linear-gradient(180deg,var(--bg-stage),var(--bg-abyss))' }}>
        <div style={{ padding: '18px 20px 6px', textAlign: 'center', flex: '0 0 auto', position: 'relative' }}>
          {onBack && <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', left: 16, top: 16, width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-display)', paddingBottom: 2 }}>‹</button>}
          <div className="num" style={{ fontSize: 10, letterSpacing: '.26em', color: 'var(--luna-mid)' }}>PRE-GAME LOADOUT</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, marginTop: 4 }}>Choose your towers</div>
          <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>Pick up to {MAX} to carry into the battle · <span style={{ color: 'var(--gold)' }}>{picked.length}/{MAX}</span></div>
        </div>
        <div style={{ overflowY: 'auto', padding: '14px 18px 4px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 11 }}>
            {keys.map((k) => {
              const t = TOWERS[k]; const sel = picked.includes(k); const full = !sel && picked.length >= MAX;
              const C = t.comp;
              return (
                <button key={k} onClick={() => toggle(k)} style={{ position: 'relative', padding: '12px 10px 11px', borderRadius: 'var(--r-md)', textAlign: 'center', cursor: full ? 'default' : 'pointer',
                  background: sel ? 'var(--bg-elevated)' : 'var(--bg-panel)', border: `1.5px solid ${sel ? `var(${t.token})` : 'var(--bg-line)'}`,
                  boxShadow: sel ? `0 0 14px -4px var(${t.token})` : 'none', opacity: full ? .45 : 1, transition: 'transform .12s, box-shadow .15s', transform: sel ? 'translateY(-2px)' : 'none' }}>
                  {sel && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 800, background: `var(${t.token})`, color: '#1a0f2e' }}>✓</div>}
                  {AIR.includes(k) && <div title="Can hit flying enemies" style={{ position: 'absolute', top: 8, left: 8, fontSize: 12 }}>✈️</div>}
                  <div style={{ height: 56, display: 'grid', placeItems: 'end center' }}><div style={{ width: 46 }}><C level={1} /></div></div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--text-bright)', marginTop: 7 }}>{t.name}</div>
                  <div className="muted" style={{ fontSize: 10.5, marginTop: 1 }}>{t.role}</div>
                  <div className="num" style={{ fontSize: 11.5, color: 'var(--gold)', marginTop: 4 }}>💰 {t.cost}</div>
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ padding: '10px 18px 16px', flex: '0 0 auto', borderTop: '1px solid var(--bg-line)' }}>
          <div className="num" style={{ fontSize: 11, textAlign: 'center', marginBottom: 8, color: hasAir ? 'var(--text-dim)' : 'var(--danger)' }}>{hasAir ? '✈️ You can hit flying enemies' : '⚠ No ✈️ tower — flying enemies will slip through!'}</div>
          <button onClick={() => onConfirm(picked)} disabled={picked.length === 0} className="btn btn-primary" style={{ width: '100%', minHeight: 52, fontSize: 17, opacity: picked.length === 0 ? .5 : 1 }}>▶ To battle</button>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- MAIN MENU ----------
function MainMenu({ best, gems, ach, achTotal, dailyBest, onPlay, onEndless, onShop, onSettings, onAch, onDaily }) {
  const TB = TOWERS.blossom.comp;
  return (
    <OverlayBackdrop z={2500}>
      <Panel width={300} style={{ background: 'radial-gradient(120% 80% at 50% 0%, var(--bg-stage), var(--bg-abyss))' }}>
        <div style={{ padding: '26px 24px 22px', textAlign: 'center' }}>
          <div style={{ position: 'relative', height: 96, marginBottom: 2 }}>
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><div style={{ width: 150, height: 150, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,111,165,.28),transparent 70%)', animation: 'pulse-glow 3s ease-in-out infinite' }} /></div>
            <div style={{ position: 'relative', width: 80, margin: '0 auto' }}><TB level={3} /></div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, lineHeight: .92 }}><span style={{ color: 'var(--blossom-mid)' }}>Bloom</span> <span style={{ color: 'var(--bubble-mid)' }}>Bastion</span></div>
          <div className="num" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '.24em', marginTop: 6, marginBottom: 18 }}>TOWER DEFENSE</div>
          <div className="col gap2">
            <MBtn kind="primary" onClick={onPlay}>▶ Play</MBtn>
            <MBtn kind="gold" onClick={onEndless}>♾ Endless</MBtn>
            <div className="row gap2">
              <MBtn onClick={onDaily} style={{ fontSize: 14 }}>📅 Daily</MBtn>
              <MBtn onClick={onAch} style={{ fontSize: 14 }}>🏆 {ach != null ? `${ach}/${achTotal}` : 'Awards'}</MBtn>
            </div>
            <div className="row gap2">
              <MBtn onClick={onShop} style={{ fontSize: 14 }}>🛒 Shop</MBtn>
              <MBtn onClick={onSettings} style={{ fontSize: 14 }}>⚙ Settings</MBtn>
            </div>
          </div>
          <div className="num" style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 16 }}>v1.0 · best wave {best || 0} · 💎 {gems || 0}{dailyBest ? ` · daily ${dailyBest.toLocaleString()}` : ''}</div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- DIFFICULTY SELECT ----------
function DifficultySelect({ onPick, onBack }) {
  const diffs = [
    ['sprout', 'Sprout', 'EASY', '10 waves', 'var(--success)'],
    ['bloom', 'Bloom', 'NORMAL', '20 waves', 'var(--gold)'],
    ['bastion', 'Bastion', 'HARD', '30 waves · boss', 'var(--danger)'],
  ];
  return (
    <OverlayBackdrop z={2550} onClick={onBack}>
      <Panel width={344}>
        <div style={{ padding: '18px 20px 6px', textAlign: 'center', position: 'relative' }}>
          {onBack && <button onClick={onBack} aria-label="Back" style={{ position: 'absolute', left: 16, top: 14, width: 32, height: 32, borderRadius: 99, background: 'var(--bg-abyss)', border: '1px solid var(--bg-line)', color: 'var(--text-soft)', cursor: 'pointer', fontSize: 16, fontFamily: 'var(--font-display)', paddingBottom: 2 }}>‹</button>}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 23 }}>Choose your fight</div>
        </div>
        <div style={{ padding: '10px 18px 18px' }} className="col gap3">
          {diffs.map(([k, n, t, s, c]) => (
            <button key={k} onClick={() => onPick(k)} style={{ textAlign: 'left', padding: '14px 16px', borderRadius: 'var(--r-md)', background: 'var(--bg-panel)', border: `2px solid ${c}`, boxShadow: `0 0 16px -7px ${c}`, cursor: 'pointer', transition: 'transform .12s' }}>
              <div className="row between" style={{ alignItems: 'center' }}><span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: c }}>{n}</span><span className="num" style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.08em' }}>{t}</span></div>
              <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>{s}</div>
            </button>
          ))}
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- WAVE CLEAR (between waves) ----------
function WaveClearOverlay({ wave, total, bonus, interest, onNext }) {
  return (
    <OverlayBackdrop z={2400} onClick={onNext}>
      <Panel width={300} style={{ background: 'radial-gradient(120% 100% at 50% 0%, var(--bg-stage), var(--bg-abyss))' }}>
        <div style={{ padding: '24px 22px', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--bubble-mid)', textShadow: '0 0 16px var(--bubble-mid)' }}>WAVE {wave}{total !== Infinity ? ` / ${total}` : ''}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, lineHeight: 1 }}>CLEARED!</div>
          <div className="col gap2" style={{ margin: '16px 0' }}>
            {[['🌊 Wave bonus', '+' + bonus], ['🏦 Interest 10%', '+' + interest]].map(([l, v]) => (
              <div key={l} className="row between" style={{ background: 'var(--bg-abyss)', borderRadius: 10, padding: '8px 12px', border: '1px solid var(--bg-line)', gap: 8 }}><span className="muted" style={{ fontSize: 12.5, whiteSpace: 'nowrap' }}>{l}</span><span className="num" style={{ fontSize: 15, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{v} 💰</span></div>
            ))}
          </div>
          <MBtn kind="primary" onClick={onNext}>Next wave →</MBtn>
          <div className="num" style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 10 }}>Place more towers, then start the wave</div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- VICTORY ----------
function VictoryOverlay({ score, onRetry, onMenu }) {
  return (
    <OverlayBackdrop z={2400}>
      <Panel width={300} style={{ background: 'radial-gradient(120% 100% at 50% 20%, rgba(68,224,138,.18), var(--bg-abyss))' }}>
        <div style={{ padding: '26px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 44 }}>🏆</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: 'var(--success)', textShadow: '0 0 20px var(--success)' }}>VICTORY!</div>
          <div className="row center gap2" style={{ marginTop: 8 }}>{[1, 2, 3].map(i => <span key={i} style={{ fontSize: 26, color: 'var(--gold)' }}>★</span>)}</div>
          <div className="num" style={{ fontSize: 14, color: 'var(--text-soft)', marginTop: 8 }}>Score {score.toLocaleString()}</div>
          <div className="col gap2" style={{ marginTop: 18 }}>
            <MBtn kind="gold" onClick={onRetry}>↻ Play again</MBtn>
            <MBtn onClick={onMenu}>Main menu</MBtn>
          </div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- DEFEAT ----------
function DefeatOverlay({ wave, total, score, onRetry, onMenu }) {
  const ED = ENEMIES.dragon.comp;
  return (
    <OverlayBackdrop z={2400}>
      <Panel width={300} style={{ background: 'radial-gradient(120% 100% at 50% 30%, rgba(255,77,109,.16), var(--bg-abyss))' }}>
        <div style={{ padding: '24px 22px', textAlign: 'center' }}>
          <div style={{ width: 66, margin: '0 auto', opacity: .92 }}><ED phase={2} /></div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: 'var(--danger)', textShadow: '0 0 18px var(--danger)', marginTop: 4 }}>BASTION FELL</div>
          <div className="num" style={{ fontSize: 13, color: 'var(--text-soft)', marginTop: 6 }}>Reached wave {wave}{total !== Infinity ? ` / ${total}` : ''} · {score.toLocaleString()} pts</div>
          <div className="col gap2" style={{ marginTop: 18 }}>
            <MBtn kind="primary" onClick={onRetry}>↻ Retry</MBtn>
            <MBtn onClick={onMenu}>Main menu</MBtn>
          </div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

// ---------- INFO (e.g. Shop placeholder) ----------
function InfoOverlay({ icon, title, text, onClose }) {
  return (
    <OverlayBackdrop z={3300} onClick={onClose}>
      <Panel width={300}>
        <div style={{ padding: '24px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>{icon}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, marginTop: 6 }}>{title}</div>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 8, lineHeight: 1.5 }}>{text}</p>
          <div style={{ marginTop: 16 }}><MBtn kind="primary" onClick={onClose}>Got it</MBtn></div>
        </div>
      </Panel>
    </OverlayBackdrop>
  );
}

Object.assign(window, { loadSettings, saveSettings, DEFAULT_SETTINGS, SettingsPanel, PauseMenu, LoadoutOverlay, MainMenu, DifficultySelect, WaveClearOverlay, VictoryOverlay, DefeatOverlay, InfoOverlay });
