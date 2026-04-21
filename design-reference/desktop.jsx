// Desktop dashboard — 1440 × 1024-ish artboard

const DS = {
  bg: '#050505',
  surface: '#0a0a0a',
  surface2: '#111111',
  border: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.10)',
  text: '#fafafa',
  text2: 'rgba(250,250,250,0.60)',
  text3: 'rgba(250,250,250,0.40)',
  text4: 'rgba(250,250,250,0.25)',
  accent: '#fafafa',
  rival: '#737373',
  rivalDot: 'rgba(250,250,250,0.35)',
  pos: '#d4d4d4', // "en tête"
  neg: 'rgba(250,250,250,0.45)',
  radius: 6,
};

const sansStack = `"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif`;
const monoStack = `"Geist Mono", "JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace`;

// -------- Sidebar --------
function Sidebar({ active = 'home', density = 'balanced' }) {
  const items = [
    { id: 'home',    label: 'Dashboard',    icon: I.home },
    { id: 'stats',   label: 'Statistiques', icon: I.chart },
    { id: 'projects',label: 'Projets',      icon: I.folder },
    { id: 'history', label: 'Historique',   icon: I.clock },
    { id: 'settings',label: 'Paramètres',   icon: I.settings },
  ];
  return (
    <div style={{
      width: 220, background: DS.surface, borderRight: `1px solid ${DS.border}`,
      display: 'flex', flexDirection: 'column', padding: '20px 14px',
      flexShrink: 0,
    }}>
      {/* Workspace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', marginBottom: 18 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5,
          background: 'linear-gradient(135deg, #fafafa 0%, #737373 100%)',
          display: 'grid', placeItems: 'center', color: '#050505',
          fontSize: 11, fontWeight: 700,
        }}>D·I</div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: DS.text }}>Diego × Ismaël</div>
          <div style={{ fontSize: 10.5, color: DS.text3 }}>Workspace</div>
        </div>
        <div style={{ color: DS.text3 }}>{I.chevron(10)}</div>
      </div>

      {/* Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => (
          <div key={it.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 9px', borderRadius: 5,
            background: active === it.id ? 'rgba(255,255,255,0.05)' : 'transparent',
            color: active === it.id ? DS.text : DS.text2,
            fontSize: 13, fontWeight: active === it.id ? 500 : 400,
            cursor: 'pointer',
          }}>
            {it.icon(14)}
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
      <div style={{ fontSize: 10, color: DS.text4, textTransform: 'uppercase', letterSpacing: 0.8, padding: '0 9px', marginBottom: 6 }}>Équipe</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {['diego', 'ismael'].map(u => (
          <div key={u} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 9px', borderRadius: 5, fontSize: 12.5,
            color: u === CURRENT ? DS.text : DS.text2,
          }}>
            <Avatar name={u} size={18} active={u === CURRENT} />
            <span>{USERS[u].name}</span>
            {u === CURRENT && <span style={{ fontSize: 10, color: DS.text3, marginLeft: 'auto', fontFamily: monoStack }}>toi</span>}
          </div>
        ))}
      </div>

      <div style={{ flex: 1 }} />

      {/* User card */}
      <div style={{
        borderTop: `1px solid ${DS.border}`, padding: '12px 9px', marginTop: 12,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Avatar name={CURRENT} size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: DS.text, fontWeight: 500 }}>{USERS[CURRENT].name}</div>
          <div style={{ fontSize: 10.5, color: DS.text3 }}>diego@myfolio.co</div>
        </div>
        <div style={{ color: DS.text3 }}>{I.settings(13)}</div>
      </div>
    </div>
  );
}

// -------- Top insight banner --------
function InsightBanner() {
  const weekDiff = WEEK.diego - WEEK.ismael; // negative ⇒ rival ahead
  const leader = weekDiff >= 0 ? 'diego' : 'ismael';
  const gap = Math.abs(weekDiff);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '11px 18px',
      borderBottom: `1px solid ${DS.border}`,
      background: DS.surface,
      fontSize: 12.5,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '3px 8px', borderRadius: 4,
        border: `1px solid ${DS.border}`,
        color: DS.text2, fontSize: 10.5, fontFamily: monoStack,
        textTransform: 'uppercase', letterSpacing: 0.6,
      }}>
        <span style={{ color: DS.text3 }}>{I.sparkle(11)}</span>
        Insight
      </div>
      <div style={{ color: DS.text, fontWeight: 500 }}>
        {leader === CURRENT
          ? <>Tu mènes la semaine de <span style={{ fontFamily: monoStack }}>{fmt(gap)}</span>.</>
          : <>{USERS[leader].name} mène la semaine de <span style={{ fontFamily: monoStack }}>{fmt(gap)}</span>.</>}
      </div>
      <div style={{ width: 1, height: 14, background: DS.border }} />
      <div style={{ color: DS.text2 }}>
        Streak en cours · <span style={{ color: DS.text, fontFamily: monoStack }}>{STREAK[CURRENT]} jours</span>
      </div>
      <div style={{ width: 1, height: 14, background: DS.border }} />
      <div style={{ color: DS.text2 }}>
        Nouveau record journalier <span style={{ fontFamily: monoStack, color: DS.text }}>9.25h</span> il y a 6 jours
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', gap: 6, color: DS.text3, fontSize: 11 }}>
        <button style={btnGhost}>{I.download(12)} Exporter CSV</button>
      </div>
    </div>
  );
}

const btnGhost = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '5px 10px', borderRadius: 5,
  background: 'transparent', border: `1px solid ${DS.border}`,
  color: DS.text2, fontSize: 11, cursor: 'pointer', fontFamily: sansStack,
};

// -------- Metric card --------
function Metric({ label, value, rivalValue, trend, hint }) {
  const diff = value - rivalValue;
  const leading = diff >= 0;
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 126,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 11.5, color: DS.text3, textTransform: 'uppercase', letterSpacing: 0.6 }}>{label}</div>
        <div style={{ color: DS.text4, fontSize: 11 }}>{trend}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <div style={{ fontSize: 32, fontFamily: monoStack, color: DS.text, fontWeight: 500, letterSpacing: -0.5 }}>
          {value.toFixed(value % 1 === 0 ? 0 : 2).replace(/0+$/,'').replace(/\.$/,'')}
          <span style={{ fontSize: 16, color: DS.text3, marginLeft: 2 }}>h</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: DS.text3, fontFamily: monoStack }}>
        <Avatar name={RIVAL} size={14} />
        <span>{USERS[RIVAL].name} · {fmt(rivalValue)}</span>
        <span style={{
          marginLeft: 'auto',
          color: leading ? DS.text : DS.text2,
          display: 'inline-flex', alignItems: 'center', gap: 3,
        }}>
          {leading ? I.arrowUp(10) : I.arrowDn(10)}
          {fmtDiff(value, rivalValue)}
        </span>
      </div>
    </div>
  );
}

// -------- Versus card --------
function VersusCard() {
  const diff = WEEK.diego - WEEK.ismael;
  const leader = diff >= 0 ? 'diego' : 'ismael';
  const max = Math.max(WEEK.diego, WEEK.ismael);
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: 14,
      gridColumn: 'span 2',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11.5, color: DS.text3, textTransform: 'uppercase', letterSpacing: 0.6 }}>Tu vs {USERS[RIVAL].name}</div>
          <div style={{ fontSize: 10.5, color: DS.text4, fontFamily: monoStack }}>CETTE SEMAINE</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: DS.text2, fontFamily: monoStack }}>
          {I.trophy(12)}
          <span>{USERS[leader].name} en tête</span>
        </div>
      </div>

      {/* Two-row bar comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[CURRENT, RIVAL].map((u, i) => {
          const v = WEEK[u];
          const isMe = u === CURRENT;
          return (
            <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 64, fontSize: 12, color: isMe ? DS.text : DS.text2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar name={u} size={18} active={isMe} />
                <span>{isMe ? 'Toi' : USERS[u].name}</span>
              </div>
              <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%', width: `${(v / max) * 100}%`,
                  background: isMe ? DS.text : 'rgba(250,250,250,0.35)',
                  borderRadius: 2,
                  transition: 'width 600ms cubic-bezier(.2,.8,.2,1)',
                }}/>
              </div>
              <div style={{ width: 70, textAlign: 'right', fontFamily: monoStack, fontSize: 13, color: isMe ? DS.text : DS.text2 }}>
                {fmt(v)}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, paddingTop: 10,
        borderTop: `1px solid ${DS.border}`, fontSize: 11.5, color: DS.text3,
      }}>
        <span>Écart&nbsp;
          <span style={{ fontFamily: monoStack, color: DS.text }}>{fmt(Math.abs(diff))}</span>
          <span style={{ marginLeft: 6 }}>({pct(Math.abs(diff) / Math.max(WEEK.diego, WEEK.ismael))})</span>
        </span>
        <span style={{ color: DS.text4 }}>·</span>
        <span>Objectif hebdo&nbsp;<span style={{ fontFamily: monoStack, color: DS.text2 }}>{USERS[CURRENT].weeklyGoal}h</span></span>
        <span style={{ marginLeft: 'auto', fontFamily: monoStack, color: DS.text2 }}>{pct(WEEK.diego / USERS[CURRENT].weeklyGoal)} atteint</span>
      </div>
    </div>
  );
}

// -------- Big chart card --------
function ChartCard() {
  const [range, setRange] = React.useState('30j');
  const n = range === '7j' ? 7 : 30;
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px 8px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Heures quotidiennes</div>
          <div style={{ fontSize: 11.5, color: DS.text3, marginTop: 2 }}>Comparaison sur {n} jours</div>
        </div>
        <div style={{ display: 'flex', gap: 2, background: DS.surface2, border: `1px solid ${DS.border}`, borderRadius: 5, padding: 2 }}>
          {['7j', '30j', '3m', '1a'].map(r => (
            <div key={r} onClick={() => setRange(r)} style={{
              padding: '4px 10px', fontSize: 11, borderRadius: 3,
              color: r === range ? DS.text : DS.text3,
              background: r === range ? 'rgba(255,255,255,0.06)' : 'transparent',
              fontFamily: monoStack, cursor: 'pointer',
            }}>{r}</div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: DS.text2 }}>
          <div style={{ width: 14, height: 2, background: DS.text }} />
          <span>Toi</span>
          <span style={{ color: DS.text4, fontFamily: monoStack }}>{fmt(sum(SERIES.diego, n))}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: DS.text2 }}>
          <div style={{ width: 14, height: 2, background: DS.rival, backgroundImage: `repeating-linear-gradient(90deg, ${DS.rival} 0 3px, transparent 3px 6px)` }} />
          <span>{USERS[RIVAL].name}</span>
          <span style={{ color: DS.text4, fontFamily: monoStack }}>{fmt(sum(SERIES.ismael, n))}</span>
        </div>
      </div>

      <LineChart
        a={SERIES.diego.slice(0, n)}
        b={SERIES.ismael.slice(0, n)}
        width={640} height={170}
        colors={[DS.text, DS.rival]}
      />

      {/* x-axis ticks */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0 6px',
        fontSize: 10, color: DS.text4, fontFamily: monoStack, textTransform: 'uppercase', letterSpacing: 0.6,
      }}>
        {range === '30j'
          ? <><span>il y a 30j</span><span>21j</span><span>14j</span><span>7j</span><span>auj.</span></>
          : <><span>lun</span><span>mar</span><span>mer</span><span>jeu</span><span>ven</span><span>sam</span><span>dim</span></>}
      </div>
    </div>
  );
}
const sum = (arr, n) => arr.slice(0, n).reduce((a, b) => a + b, 0);

// -------- Projects breakdown --------
function ProjectsCard() {
  const max = Math.max(...PROJECTS.map(p => p.hours.diego + p.hours.ismael));
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Répartition par projet</div>
        <div style={{ fontSize: 11, color: DS.text3, fontFamily: monoStack }}>CE MOIS</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {PROJECTS.slice(0, 5).map(p => {
          const total = p.hours.diego + p.hours.ismael;
          return (
            <div key={p.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: DS.text2 }}>{p.name}</span>
                <span style={{ fontFamily: monoStack, color: DS.text3 }}>{fmt(total)}</span>
              </div>
              {/* Stacked bar */}
              <div style={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{ width: `${(p.hours.diego / max) * 100}%`, background: DS.text, transition: 'width 400ms' }} />
                <div style={{ width: `${(p.hours.ismael / max) * 100}%`, background: 'rgba(250,250,250,0.30)', transition: 'width 400ms' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------- Goals card (weekly + monthly) --------
function GoalsCard() {
  const wProg = WEEK[CURRENT] / USERS[CURRENT].weeklyGoal;
  const mProg = MONTH[CURRENT] / USERS[CURRENT].monthlyGoal;
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Objectifs</div>
        <div style={{ fontSize: 10, color: DS.text4 }}>{I.target(12)}</div>
      </div>
      {[
        { k: 'Semaine', v: WEEK[CURRENT],  g: USERS[CURRENT].weeklyGoal,  p: wProg },
        { k: 'Mois',    v: MONTH[CURRENT], g: USERS[CURRENT].monthlyGoal, p: mProg },
      ].map(row => (
        <div key={row.k}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5, color: DS.text3 }}>{row.k}</span>
            <span style={{ fontFamily: monoStack, fontSize: 12, color: DS.text }}>
              {fmt(row.v)} <span style={{ color: DS.text4 }}>/ {row.g}h</span>
            </span>
          </div>
          <HBar value={row.v} max={row.g} color={row.p >= 1 ? DS.text : DS.text} />
          <div style={{ marginTop: 4, fontSize: 10, color: DS.text4, fontFamily: monoStack, textAlign: 'right' }}>
            {pct(row.p)}
          </div>
        </div>
      ))}
    </div>
  );
}

// -------- Streak / heatmap --------
function StreakCard() {
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Activité — 13 semaines</div>
          <div style={{ fontSize: 11.5, color: DS.text3, marginTop: 2 }}>
            Streak&nbsp;<span style={{ fontFamily: monoStack, color: DS.text }}>{STREAK[CURRENT]} jours</span>
            <span style={{ color: DS.text4, margin: '0 6px' }}>·</span>
            record&nbsp;<span style={{ fontFamily: monoStack, color: DS.text2 }}>14</span>
          </div>
        </div>
      </div>
      <Heatmap days={HEATMAP} cell={11} gap={3} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: DS.text4, fontFamily: monoStack, marginLeft: 'auto' }}>
        <span>moins</span>
        {[0.08, 0.22, 0.4, 0.65, 0.95].map((v, i) => (
          <div key={i} style={{ width: 9, height: 9, borderRadius: 2, background: `rgba(250,250,250,${v})` }} />
        ))}
        <span>plus</span>
      </div>
    </div>
  );
}

// -------- Recent entries --------
function RecentCard() {
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 0 4px', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px 12px' }}>
        <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Entrées récentes</div>
        <div style={{ fontSize: 11, color: DS.text3 }}>Voir tout</div>
      </div>
      <div>
        {RECENT.slice(0, 6).map((e, i) => {
          const proj = PROJECTS.find(p => p.id === e.project);
          return (
            <div key={e.id} style={{
              display: 'grid', gridTemplateColumns: '22px 1fr auto',
              gap: 12, alignItems: 'center',
              padding: '9px 18px',
              borderTop: i === 0 ? `1px solid ${DS.border}` : 'none',
              borderBottom: `1px solid ${DS.border}`,
            }}>
              <Avatar name={e.user} size={20} active={e.user === CURRENT} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: DS.text, display: 'flex', gap: 8, alignItems: 'baseline' }}>
                  <span>{proj?.name || e.project}</span>
                  <span style={{ color: DS.text4, fontSize: 11 }}>·</span>
                  <span style={{ color: DS.text3, fontFamily: monoStack, fontSize: 11 }}>{e.date}</span>
                </div>
                {e.note && <div style={{ fontSize: 11.5, color: DS.text3, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.note}</div>}
              </div>
              <div style={{ fontFamily: monoStack, fontSize: 13, color: DS.text }}>{fmt(e.hours)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------- Badges --------
function BadgesCard() {
  return (
    <div style={{
      background: DS.surface, border: `1px solid ${DS.border}`, borderRadius: DS.radius,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, color: DS.text, fontWeight: 500 }}>Badges</div>
        <div style={{ fontSize: 11, color: DS.text3, fontFamily: monoStack }}>2 / 6</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {BADGES.map(b => (
          <div key={b.id} style={{
            border: `1px solid ${DS.border}`, borderRadius: 5,
            padding: '10px 10px', background: b.earned ? 'rgba(255,255,255,0.03)' : 'transparent',
            opacity: b.earned ? 1 : 0.55,
            display: 'flex', flexDirection: 'column', gap: 6, minHeight: 62,
          }}>
            <div style={{ color: b.earned ? DS.text : DS.text3 }}>
              {b.id.includes('streak') ? I.flame(13)
                : b.id.includes('month') ? I.target(13)
                : b.id.includes('first') ? I.trophy(13)
                : b.id.includes('marathon') ? I.trend(13)
                : I.sparkle(13)}
            </div>
            <div style={{ fontSize: 10.5, color: b.earned ? DS.text : DS.text3, lineHeight: 1.3 }}>{b.label}</div>
            {b.progress && !b.earned && (
              <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ width: `${b.progress * 100}%`, height: '100%', background: 'rgba(250,250,250,0.4)' }}/>
              </div>
            )}
            {b.earned && <div style={{ fontSize: 9.5, color: DS.text4, fontFamily: monoStack }}>{b.when}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// -------- Live timer (running) --------
function TimerBar({ running, elapsed, onToggle }) {
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = Math.floor(elapsed % 60);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 8px 6px 14px',
      background: running ? 'rgba(255,255,255,0.04)' : DS.surface2,
      border: `1px solid ${running ? 'rgba(255,255,255,0.15)' : DS.border}`,
      borderRadius: 6,
    }}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: running ? '#fafafa' : DS.text4,
        boxShadow: running ? '0 0 0 3px rgba(250,250,250,0.1)' : 'none',
        animation: running ? 'pulse 1.8s ease-in-out infinite' : 'none',
      }}/>
      <div style={{ fontFamily: monoStack, fontSize: 13, color: DS.text, minWidth: 64 }}>
        {String(h).padStart(2,'0')}:{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}
      </div>
      <div style={{ fontSize: 11, color: DS.text3, borderLeft: `1px solid ${DS.border}`, paddingLeft: 10 }}>
        My Folio — Core
      </div>
      <button onClick={onToggle} style={{
        marginLeft: 4, width: 26, height: 26, borderRadius: 5,
        background: DS.text, color: '#050505',
        border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer',
      }}>
        {running ? I.pause(12) : I.play(12)}
      </button>
    </div>
  );
}

// -------- TOP BAR with greeting + timer + + button --------
function TopBar({ timer, onToggleTimer, onAdd }) {
  const hr = 10; // imagined 10am
  const hello = hr < 12 ? 'Bonjour' : hr < 18 ? "Bon après-midi" : 'Bonsoir';
  return (
    <div style={{
      padding: '24px 28px 22px', borderBottom: `1px solid ${DS.border}`,
      display: 'flex', alignItems: 'flex-end', gap: 18,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11.5, color: DS.text3, fontFamily: monoStack, textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Mardi 21 avril · Semaine 17
        </div>
        <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: -0.6, color: DS.text, marginTop: 4 }}>
          {hello}, Diego.
        </div>
      </div>
      <TimerBar running={timer.running} elapsed={timer.elapsed} onToggle={onToggleTimer} />
      <button onClick={onAdd} style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 14px', borderRadius: 6,
        background: DS.text, color: '#050505',
        border: 'none', fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
        fontFamily: sansStack,
      }}>
        {I.plus(14)}
        Ajouter des heures
        <span style={{ fontFamily: monoStack, fontSize: 10, color: 'rgba(5,5,5,0.5)', padding: '1px 4px', background: 'rgba(5,5,5,0.12)', borderRadius: 3, marginLeft: 4 }}>N</span>
      </button>
    </div>
  );
}

// -------- MAIN Desktop Dashboard --------
function DesktopDashboard({ onAdd, timer, onToggleTimer }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: DS.bg,
      color: DS.text, fontFamily: sansStack, fontSize: 13,
      display: 'flex', overflow: 'hidden',
      fontFeatureSettings: '"ss01","cv11"',
    }}>
      <Sidebar active="home" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TopBar timer={timer} onToggleTimer={onToggleTimer} onAdd={onAdd} />
        <InsightBanner />

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
            <Metric label="Aujourd'hui" value={TODAY.diego}  rivalValue={TODAY.ismael}  trend="" />
            <Metric label="Cette semaine" value={WEEK.diego} rivalValue={WEEK.ismael} trend="" />
            <VersusCard />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 14 }}>
            <Metric label="Ce mois" value={MONTH.diego} rivalValue={MONTH.ismael} trend="" />
            <GoalsCard />
            <ProjectsCard />
            <BadgesCard />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, marginBottom: 14 }}>
            <ChartCard />
            <StreakCard />
          </div>

          <RecentCard />
          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  );
}

window.DesktopDashboard = DesktopDashboard;
