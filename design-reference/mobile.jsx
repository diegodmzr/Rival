// Mobile dashboard — iPhone-ish 390 × 844 artboard

const MS = {
  bg: '#050505', surface: '#0a0a0a', surface2: '#111111',
  border: 'rgba(255,255,255,0.06)', borderStrong: 'rgba(255,255,255,0.10)',
  text: '#fafafa', text2: 'rgba(250,250,250,0.60)',
  text3: 'rgba(250,250,250,0.40)', text4: 'rgba(250,250,250,0.25)',
  rival: 'rgba(250,250,250,0.35)',
};
const sansM = `"Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`;
const monoM = `"Geist Mono", ui-monospace, Menlo, monospace`;

function StatusBar() {
  return (
    <div style={{
      height: 44, padding: '0 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      color: MS.text, fontSize: 14, fontWeight: 600, fontFamily: sansM,
    }}>
      <div>9:41</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill="none"><path d="M1 10h1M5 8h1v2H5zM9 5h1v5H9zM13 2h1v8h-1z" stroke="currentColor" strokeWidth="1.5"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none"><path d="M1 5a11 11 0 0114 0M3.5 7a7 7 0 019 0M6 9a3 3 0 014 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" stroke="currentColor" opacity="0.6"/><rect x="2" y="2" width="16" height="7" rx="1" fill="currentColor"/><path d="M22.5 4v3" stroke="currentColor" opacity="0.5"/></svg>
      </div>
    </div>
  );
}

function MobileHeader() {
  return (
    <div style={{
      padding: '8px 20px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 10.5, color: MS.text3, fontFamily: monoM, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Mar 21 avr
        </div>
        <div style={{ fontSize: 22, color: MS.text, fontWeight: 500, letterSpacing: -0.4, marginTop: 2 }}>
          Bonjour, Diego.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          border: `1px solid ${MS.border}`, background: MS.surface,
          display: 'grid', placeItems: 'center', color: MS.text2,
        }}>{I.bell(16)}</div>
      </div>
    </div>
  );
}

function MobileInsight() {
  return (
    <div style={{
      margin: '0 16px 14px', padding: '11px 14px',
      background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8,
      display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5,
    }}>
      <div style={{ color: MS.text2 }}>{I.sparkle(14)}</div>
      <div style={{ color: MS.text, flex: 1, lineHeight: 1.35 }}>
        Ismaël mène la semaine de <span style={{ fontFamily: monoM }}>{fmt(Math.abs(WEEK.diego - WEEK.ismael))}</span>.
      </div>
      <div style={{ color: MS.text4 }}>{I.chevron(11)}</div>
    </div>
  );
}

function MobileMetricRow() {
  const cells = [
    { label: "Auj.",     me: TODAY.diego, r: TODAY.ismael },
    { label: 'Semaine',  me: WEEK.diego,  r: WEEK.ismael  },
    { label: 'Mois',     me: MONTH.diego, r: MONTH.ismael },
  ];
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
      padding: '0 16px 14px',
    }}>
      {cells.map(c => {
        const diff = c.me - c.r;
        const leading = diff >= 0;
        return (
          <div key={c.label} style={{
            background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8,
            padding: '11px 12px',
          }}>
            <div style={{ fontSize: 10, color: MS.text3, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: monoM }}>{c.label}</div>
            <div style={{ fontSize: 22, fontFamily: monoM, color: MS.text, marginTop: 6, fontWeight: 500, letterSpacing: -0.5 }}>
              {c.me.toFixed(c.me % 1 === 0 ? 0 : 2).replace(/0+$/,'').replace(/\.$/,'')}<span style={{ fontSize: 12, color: MS.text3 }}>h</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 10.5, color: leading ? MS.text2 : MS.text3, fontFamily: monoM }}>
              {leading ? I.arrowUp(9) : I.arrowDn(9)}
              <span>{fmtDiff(c.me, c.r)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileVersus() {
  const max = Math.max(WEEK.diego, WEEK.ismael);
  return (
    <div style={{
      margin: '0 16px 14px', padding: '14px 16px',
      background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: MS.text3, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: monoM }}>
          Toi vs Ismaël · semaine
        </div>
        <div style={{ fontSize: 10, color: MS.text4, fontFamily: monoM }}>S17</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[CURRENT, RIVAL].map(u => {
          const isMe = u === CURRENT;
          const v = WEEK[u];
          return (
            <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Avatar name={u} size={20} active={isMe} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${(v / max) * 100}%`, height: '100%', background: isMe ? MS.text : MS.rival, transition: 'width 500ms' }} />
                </div>
              </div>
              <div style={{ width: 54, textAlign: 'right', fontFamily: monoM, fontSize: 12.5, color: isMe ? MS.text : MS.text2 }}>
                {fmt(v)}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: `1px solid ${MS.border}`,
        display: 'flex', justifyContent: 'space-between', fontSize: 11, color: MS.text3,
      }}>
        <span>Écart <span style={{ fontFamily: monoM, color: MS.text }}>{fmt(Math.abs(WEEK.diego - WEEK.ismael))}</span></span>
        <span>Objectif <span style={{ fontFamily: monoM, color: MS.text2 }}>{pct(WEEK.diego / USERS[CURRENT].weeklyGoal)}</span></span>
      </div>
    </div>
  );
}

function MobileChart() {
  return (
    <div style={{
      margin: '0 16px 14px', padding: '14px 16px 10px',
      background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 12.5, color: MS.text, fontWeight: 500 }}>7 derniers jours</div>
        <div style={{ fontSize: 10, color: MS.text3, display: 'flex', gap: 10, fontFamily: monoM }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: MS.text }}/>Toi</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 2, background: MS.rival }}/>I.</span>
        </div>
      </div>
      <LineChart
        a={SERIES.diego.slice(0, 7)}
        b={SERIES.ismael.slice(0, 7)}
        width={320} height={110}
        colors={[MS.text, MS.rival]}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9.5, color: MS.text4, fontFamily: monoM, textTransform: 'uppercase', marginTop: 2 }}>
        {['lu','ma','me','je','ve','sa','di'].map(d => <span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

function MobileStreak() {
  return (
    <div style={{
      margin: '0 16px 14px', padding: '14px 16px',
      background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: MS.text }}>{I.flame(14)}</span>
          <div style={{ fontSize: 12.5, color: MS.text, fontWeight: 500 }}>Streak</div>
        </div>
        <div style={{ fontSize: 11, color: MS.text3, fontFamily: monoM }}>
          <span style={{ color: MS.text }}>{STREAK[CURRENT]}j</span> · record 14j
        </div>
      </div>
      <div style={{ transform: 'scale(0.85)', transformOrigin: 'left top' }}>
        <Heatmap days={HEATMAP} cell={10} gap={3} />
      </div>
    </div>
  );
}

function MobileRecent() {
  return (
    <div style={{ margin: '0 16px 100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 10px' }}>
        <div style={{ fontSize: 12.5, color: MS.text, fontWeight: 500 }}>Entrées récentes</div>
        <div style={{ fontSize: 11, color: MS.text3 }}>Tout voir</div>
      </div>
      <div style={{ background: MS.surface, border: `1px solid ${MS.border}`, borderRadius: 8, overflow: 'hidden' }}>
        {RECENT.slice(0, 4).map((e, i) => {
          const proj = PROJECTS.find(p => p.id === e.project);
          return (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 10,
              padding: '10px 12px',
              borderTop: i === 0 ? 'none' : `1px solid ${MS.border}`,
              alignItems: 'center',
            }}>
              <Avatar name={e.user} size={18} active={e.user === CURRENT} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: MS.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {proj?.name.replace('My Folio — ', '')}
                </div>
                <div style={{ fontSize: 10, color: MS.text3, fontFamily: monoM, marginTop: 1 }}>{e.date}</div>
              </div>
              <div style={{ fontFamily: monoM, fontSize: 12.5, color: MS.text }}>{fmt(e.hours)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bottom nav + the quick-add pastille
function MobileBottomNav({ onAdd, timerRunning, elapsed }) {
  const items = [
    { id: 'home',   icon: I.home,   label: 'Accueil' },
    { id: 'stats',  icon: I.chart,  label: 'Stats'   },
    { id: 'add',    icon: null,     label: null      },
    { id: 'hist',   icon: I.clock,  label: 'Hist.'   },
    { id: 'proj',   icon: I.folder, label: 'Projets' },
  ];
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 22,
      background: 'linear-gradient(to top, rgba(5,5,5,1) 60%, rgba(5,5,5,0))',
    }}>
      {/* Timer pill — floating above nav when running */}
      {timerRunning && (
        <div style={{
          margin: '0 16px 10px',
          padding: '9px 12px',
          background: MS.surface, border: `1px solid ${MS.borderStrong}`, borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', background: MS.text,
            boxShadow: '0 0 0 3px rgba(250,250,250,0.1)',
            animation: 'pulse 1.8s ease-in-out infinite',
          }}/>
          <div style={{ fontFamily: monoM, fontSize: 12, color: MS.text }}>
            {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
          </div>
          <div style={{ fontSize: 10.5, color: MS.text3, borderLeft: `1px solid ${MS.border}`, paddingLeft: 10 }}>
            Core
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 10.5, color: MS.text2, fontFamily: monoM }}>↙ arrêter</div>
        </div>
      )}

      <div style={{
        margin: '0 12px', padding: '8px 4px 10px',
        background: 'rgba(10,10,10,0.9)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${MS.border}`, borderRadius: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        position: 'relative',
      }}>
        {items.map((it, i) => {
          if (it.id === 'add') {
            return (
              <button key={it.id} onClick={onAdd} style={{
                width: 48, height: 48, borderRadius: '50%',
                background: MS.text, color: '#050505', border: 'none',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                marginTop: -14, boxShadow: '0 4px 18px rgba(255,255,255,0.12), 0 1px 0 rgba(255,255,255,0.3) inset',
              }}>
                {I.plus(20)}
              </button>
            );
          }
          const active = it.id === 'home';
          return (
            <div key={it.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? MS.text : MS.text3,
              padding: '4px 10px', cursor: 'pointer',
            }}>
              {it.icon(18)}
              <span style={{ fontSize: 9.5, fontWeight: 500 }}>{it.label}</span>
            </div>
          );
        })}
      </div>
      {/* home indicator */}
      <div style={{ width: 120, height: 4, background: MS.text, borderRadius: 4, margin: '14px auto 0', opacity: 0.9 }}/>
    </div>
  );
}

// Quick-add sheet — the pastille-triggered UI
function QuickAddSheet({ open, onClose, onSubmit }) {
  const [h, setH] = React.useState(1);
  const [project, setProject] = React.useState('folio-core');
  const [note, setNote] = React.useState('');
  const inc = (d) => setH(v => Math.max(0, Math.round((v + d) * 4) / 4));
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
        animation: 'fadeIn 180ms ease', zIndex: 90,
      }}/>
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: MS.surface, borderTop: `1px solid ${MS.borderStrong}`,
        borderRadius: '16px 16px 0 0',
        padding: '8px 18px 28px',
        animation: 'slideUp 260ms cubic-bezier(.2,.8,.2,1)',
        zIndex: 91,
      }}>
        <div style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99, margin: '6px auto 14px' }}/>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 15, color: MS.text, fontWeight: 500 }}>Ajouter des heures</div>
          <div onClick={onClose} style={{ color: MS.text3, cursor: 'pointer' }}>{I.close(18)}</div>
        </div>

        {/* Big stepper */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 12px', background: MS.surface2,
          border: `1px solid ${MS.border}`, borderRadius: 10, marginBottom: 12,
        }}>
          <button onClick={() => inc(-0.25)} style={stepBtn}>{I.minus(18)}</button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: monoM, fontSize: 40, color: MS.text, fontWeight: 500, letterSpacing: -0.8, lineHeight: 1 }}>
              {h.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}
              <span style={{ fontSize: 18, color: MS.text3, marginLeft: 2 }}>h</span>
            </div>
            <div style={{ fontSize: 10.5, color: MS.text4, fontFamily: monoM, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              par pas de 15 min
            </div>
          </div>
          <button onClick={() => inc(0.25)} style={stepBtn}>{I.plus(18)}</button>
        </div>

        {/* Quick presets */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[0.5, 1, 1.5, 2, 4, 8].map(v => (
            <button key={v} onClick={() => setH(v)} style={{
              flex: 1, padding: '8px 0', borderRadius: 6,
              background: Math.abs(h - v) < 0.01 ? 'rgba(255,255,255,0.08)' : MS.surface2,
              border: `1px solid ${Math.abs(h - v) < 0.01 ? MS.borderStrong : MS.border}`,
              color: Math.abs(h - v) < 0.01 ? MS.text : MS.text2,
              fontFamily: monoM, fontSize: 11.5, cursor: 'pointer',
            }}>{v}h</button>
          ))}
        </div>

        {/* Project */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 10.5, color: MS.text3, textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: monoM, marginBottom: 6 }}>Projet</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PROJECTS.slice(0, 4).map(p => (
              <div key={p.id} onClick={() => setProject(p.id)} style={{
                padding: '7px 12px', borderRadius: 6, fontSize: 11.5,
                background: p.id === project ? 'rgba(255,255,255,0.08)' : MS.surface2,
                border: `1px solid ${p.id === project ? MS.borderStrong : MS.border}`,
                color: p.id === project ? MS.text : MS.text2, cursor: 'pointer',
              }}>{p.name.replace('My Folio — ', '')}</div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Note optionnelle…" style={{
            width: '100%', padding: '11px 12px', borderRadius: 8,
            background: MS.surface2, border: `1px solid ${MS.border}`,
            color: MS.text, fontSize: 13, fontFamily: sansM, outline: 'none',
            boxSizing: 'border-box',
          }}/>
        </div>

        <button onClick={() => onSubmit({ h, project, note })} style={{
          width: '100%', padding: 14, borderRadius: 10,
          background: MS.text, color: '#050505', border: 'none',
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: sansM,
        }}>
          Enregistrer {fmt(h)}
        </button>
      </div>
    </>
  );
}
const stepBtn = {
  width: 46, height: 46, borderRadius: '50%',
  background: MS.surface, border: `1px solid ${MS.border}`,
  color: MS.text, display: 'grid', placeItems: 'center', cursor: 'pointer',
};

function MobileDashboard({ timer, onToggleTimer, quickAdd, setQuickAdd, onSubmitAdd }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: MS.bg,
      color: MS.text, fontFamily: sansM, position: 'relative',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <StatusBar />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <MobileHeader />
        <MobileInsight />
        <MobileMetricRow />
        <MobileVersus />
        <MobileChart />
        <MobileStreak />
        <MobileRecent />
      </div>
      <MobileBottomNav
        onAdd={() => setQuickAdd(true)}
        timerRunning={timer.running}
        elapsed={timer.elapsed}
      />
      <QuickAddSheet open={quickAdd} onClose={() => setQuickAdd(false)} onSubmit={onSubmitAdd} />
    </div>
  );
}

window.MobileDashboard = MobileDashboard;
window.QuickAddSheet = QuickAddSheet;
