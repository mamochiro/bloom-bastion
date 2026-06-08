/* global React, TOWERS, ENEMIES */
// ============================================================
// TABS — Overview, Colors, Typography
// ============================================================

// ---------- Reusable bits ----------
function Swatch({ name, token, hex, dark }) {
  const [copied, setCopied] = React.useState(false);
  const copy = () => { navigator.clipboard?.writeText(`var(${token})`); setCopied(true); setTimeout(() => setCopied(false), 900); };
  return (
    <button onClick={copy} className="swatch" style={{
      textAlign: 'left', cursor: 'pointer', border: '1px solid var(--bg-line)', background: 'var(--bg-stage)',
      borderRadius: 'var(--r-md)', overflow: 'hidden', padding: 0, color: 'inherit', fontFamily: 'inherit',
    }}>
      <div style={{ height: 58, background: hex, position: 'relative' }}>
        {copied && <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: dark ? '#fff' : '#1a0f2e' }}>copied!</span>}
      </div>
      <div style={{ padding: '8px 10px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12.5 }}>{name}</div>
        <div className="mono" style={{ color: 'var(--text-dim)', fontSize: 11 }}>{token}</div>
        <div className="mono" style={{ color: 'var(--text-faint)', fontSize: 10.5 }}>{hex}</div>
      </div>
    </button>
  );
}

function FamilyRow({ title, emoji, items }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="row gap2" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>{title}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px, 1fr))', gap: 10 }}>
        {items.map(s => <Swatch key={s.token} {...s} />)}
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title, lead }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="h-lg">{title}</h2>
      {lead && <p className="lead" style={{ marginTop: 10 }}>{lead}</p>}
    </div>
  );
}

// ---------- OVERVIEW ----------
function TabOverview({ go }) {
  const TB = TOWERS.blossom.comp, TS = TOWERS.storm.comp, TL = TOWERS.luna.comp, TBu = TOWERS.bubble.comp;
  return (
    <div className="section">
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: 40, alignItems: 'center' }} className="hero-grid">
        <div>
          <div className="eyebrow">Visual Design System · v1</div>
          <h1 className="h-xl" style={{ marginBottom: 14 }}>
            <span style={{ color: 'var(--blossom-mid)' }}>Bloom</span> <span style={{ color: 'var(--bubble-mid)' }}>Bastion</span>
          </h1>
          <p className="lead">A tower-defense art bible built on one idea: <strong style={{ color: 'var(--text-bright)' }}>cute but deadly</strong>. Pastel, glowing units bloom against a dark battlefield — flat vector for crisp scaling and high-juice motion.</p>
          <div className="row wrap gap2" style={{ marginTop: 20 }}>
            {['Flat vector + glow', 'High contrast', 'Touch-first · 56px', 'Juice over realism'].map(t => <span key={t} className="tag">{t}</span>)}
          </div>
          <div className="row wrap gap3" style={{ marginTop: 26 }}>
            <button className="btn btn-primary" onClick={() => go('towers')}>Meet the towers</button>
            <button className="btn btn-ghost" onClick={() => go('export')}>Grab tokens & atlas</button>
          </div>
        </div>
        <div className="card" style={{ padding: 18, background: 'radial-gradient(120% 120% at 50% 0%, var(--bg-stage), var(--bg-abyss))', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 50% 40%, rgba(179,136,255,.18), transparent)' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, position: 'relative', height: 200 }}>
            {[TB, TS, TL, TBu].map((C, i) => (
              <div key={i} style={{ alignSelf: 'end', height: 150 + (i%2?20:0) }}><C level={i === 0 ? 3 : 2} /></div>
            ))}
          </div>
          <div className="num" style={{ position: 'relative', textAlign: 'center', color: 'var(--text-dim)', fontSize: 12, marginTop: 8 }}>4 of 6 tower families · idle preview</div>
        </div>
      </div>

      <hr className="divider" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 16 }}>
        {[
          { k: '6', l: 'Tower families', s: '× 3 upgrade levels = 18 sprites', c: 'var(--blossom-mid)' },
          { k: '8', l: 'Enemy types', s: 'trash · flyers · tanks · 2 bosses', c: 'var(--success)' },
          { k: '5', l: 'Terrain tiles', s: '+ decorative props', c: 'var(--storm-mid)' },
          { k: '11', l: 'Design tabs', s: 'tokens → sprites → screens', c: 'var(--gold)' },
        ].map(x => (
          <div key={x.l} className="card" style={{ padding: 18 }}>
            <div className="num" style={{ fontSize: 42, color: x.c, lineHeight: 1 }}>{x.k}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginTop: 6 }}>{x.l}</div>
            <div className="muted" style={{ fontSize: 13 }}>{x.s}</div>
          </div>
        ))}
      </div>

      <hr className="divider" />
      <SectionHead eyebrow="Design pillars" title="Four rules every asset obeys" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 16 }}>
        {[
          { t: 'Flat vector + glow', d: 'No pixel art, no gradients-as-crutch. Solid fills, clean silhouettes, a glowing core as the “deadly” tell. Scales to any DPI for free.' },
          { t: 'Dark stage, bright units', d: 'The battlefield stays deep navy/violet so every pastel unit reads instantly. Glow does the heavy lifting for legibility.' },
          { t: 'Juice over realism', d: 'Bobs, squash, hit-flash, particle bursts, screen shake. Every interaction should feel physically satisfying.' },
          { t: 'Touch-first', d: 'Minimum 56px targets, thumb-reachable controls, portrait-first layout that scales up to landscape & desktop.' },
        ].map(p => (
          <div key={p.t} className="card" style={{ padding: 18 }}>
            <h3 className="h-md" style={{ color: 'var(--bubble-mid)' }}>{p.t}</h3>
            <p style={{ color: 'var(--text-soft)', fontSize: 14.5, marginTop: 8 }}>{p.d}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- COLORS ----------
function TabColors() {
  const fam = (l, m, d, prefix) => ([
    { name: 'Light', token: `--${prefix}-light`, hex: getHex(`--${prefix}-light`) },
    { name: 'Mid', token: `--${prefix}-mid`, hex: getHex(`--${prefix}-mid`) },
    { name: 'Dark', token: `--${prefix}-dark`, hex: getHex(`--${prefix}-dark`), dark: true },
  ]);
  return (
    <div className="section">
      <SectionHead eyebrow="Color System" title="Pastel families on a deep battlefield"
        lead="Six tower hue families, each with light / mid / dark shades. Backgrounds stay dark and desaturated so glowing units pop. Tap any swatch to copy its token." />

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="label" style={{ marginBottom: 12 }}>Backgrounds · battlefield depth</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(112px,1fr))', gap: 10 }}>
          {[['Abyss','--bg-abyss'],['Deep','--bg-deep'],['Stage','--bg-stage'],['Panel','--bg-panel'],['Elevated','--bg-elevated'],['Line','--bg-line']].map(([n,t]) =>
            <Swatch key={t} name={n} token={t} hex={getHex(t)} dark />)}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="label" style={{ marginBottom: 16 }}>Tower families · 6 × 3 shades</div>
        <FamilyRow title="Blossom" emoji="🌸" items={fam(0,0,0,'blossom')} />
        <FamilyRow title="Stormcloud" emoji="⚡" items={fam(0,0,0,'storm')} />
        <FamilyRow title="Sugar Cannon" emoji="🍭" items={fam(0,0,0,'sugar')} />
        <FamilyRow title="Luna Crystal" emoji="🌙" items={fam(0,0,0,'luna')} />
        <FamilyRow title="Hive" emoji="🐝" items={fam(0,0,0,'hive')} />
        <FamilyRow title="Bubbler" emoji="🌊" items={fam(0,0,0,'bubble')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>HUD accents</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px,1fr))', gap: 10 }}>
            {[['Gold','--gold'],['Gold deep','--gold-deep',true],['Danger','--danger'],['Success','--success'],['XP blue','--xp-blue']].map(([n,t,d]) =>
              <Swatch key={t} name={n} token={t} hex={getHex(t)} dark={d} />)}
          </div>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="label" style={{ marginBottom: 12 }}>HP state ramp</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {[['HP high','--hp-high'],['HP mid','--hp-mid'],['HP low','--hp-low']].map(([n,t]) =>
              <Swatch key={t} name={n} token={t} hex={getHex(t)} />)}
          </div>
          <div style={{ marginTop: 14 }}>
            {[['100%','var(--hp-high)','92%'],['Hurt','var(--hp-mid)','54%'],['Critical','var(--hp-low)','18%']].map(([l,c,w]) => (
              <div key={l} className="row gap3" style={{ marginBottom: 8 }}>
                <span className="num" style={{ width: 56, fontSize: 12, color: 'var(--text-dim)' }}>{l}</span>
                <div style={{ flex: 1, height: 12, background: 'var(--bg-abyss)', borderRadius: 99, overflow: 'hidden', border: '1px solid var(--bg-line)' }}>
                  <div style={{ width: w, height: '100%', background: c, boxShadow: `0 0 8px ${c}` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// read a CSS var off :root and return uppercased hex
function getHex(token) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    return v.toUpperCase();
  } catch { return ''; }
}

// ---------- TYPOGRAPHY ----------
function TabType() {
  return (
    <div className="section">
      <SectionHead eyebrow="Typography" title="Rounded, friendly, characterful"
        lead="Baloo 2 carries the personality on titles and big numbers. Nunito keeps body copy clean and legible. HUD numerals lock to tabular figures so counters never jitter." />

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div className="row between wrap gap3" style={{ marginBottom: 8 }}>
          <div className="label">Display · Baloo 2</div>
          <span className="code">--font-display</span>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(40px,8vw,86px)', lineHeight: .95, background: 'linear-gradient(180deg,var(--blossom-light),var(--blossom-mid))', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>Bloom Bastion</div>
        <div className="row wrap gap4" style={{ marginTop: 16 }}>
          {[['Extra-bold 800','800'],['Bold 700','700'],['Semibold 600','600'],['Medium 500','500']].map(([l,w]) =>
            <div key={w}><div style={{ fontFamily:'var(--font-display)', fontWeight:w, fontSize: 26 }}>Wave 12</div><div className="muted" style={{ fontSize: 11 }}>{l}</div></div>)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 12 }}><div className="label">Body · Nunito</div><span className="code">--font-body</span></div>
          <p style={{ fontSize: 17, color: 'var(--text-soft)' }}>Defend the bastion across 30 waves. Place towers on grass, upgrade between rounds, and survive the Neon Dragon’s second phase.</p>
          <p style={{ fontSize: 14, color: 'var(--text-dim)', marginTop: 10 }}>Smaller secondary copy — tooltips, descriptions, captions. Stays readable down to 13px on mobile.</p>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 12 }}><div className="label">HUD numerals · tabular</div><span className="code">.num</span></div>
          <div className="row wrap gap4">
            {[['❤','24','var(--danger)'],['💰','1,250','var(--gold)'],['🌊','12/30','var(--storm-mid)'],['⭐','86,400','var(--bubble-mid)']].map(([i,n,c]) => (
              <div key={i} className="col" style={{ alignItems:'center' }}>
                <div style={{ fontSize: 20 }}>{i}</div>
                <div className="num" style={{ fontSize: 30, color: c }}>{n}</div>
              </div>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>Tabular figures keep counters from shifting width as values tick — essential for live HUD readouts.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 16 }}>
        <div className="label" style={{ marginBottom: 14 }}>Type scale</div>
        <div className="col gap3">
          {[['Display / Title','clamp(34px,6vw,60px)','800','h-xl'],['Heading','clamp(26px,4vw,38px)','800','h-lg'],['Subhead','22px','800','h-md'],['Lead','17px','600','lead'],['Body','15px','500','body'],['Caption','12px','700','caption']].map(([n,sz,w]) => (
            <div key={n} className="row between wrap" style={{ borderBottom: '1px solid var(--bg-line)', paddingBottom: 10 }}>
              <span style={{ fontFamily:'var(--font-display)', fontWeight:w, fontSize: `min(${sz.includes('clamp')?'38px':sz}, 38px)` }}>{n}</span>
              <span className="code">{sz}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TabOverview, TabColors, TabType, SectionHead, Swatch, getHex });
