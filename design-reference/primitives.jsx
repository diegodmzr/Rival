// Shared primitives — icons, tiny SVG charts, util bits.

const fmt = (h) => {
  if (h === 0) return '0h';
  if (Number.isInteger(h)) return `${h}h`;
  return `${h.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}h`;
};
const fmtDiff = (a, b) => {
  const d = a - b;
  if (Math.abs(d) < 0.01) return '±0h';
  return (d > 0 ? '+' : '') + fmt(d);
};
const pct = (n) => `${Math.round(n * 100)}%`;

// Minimal, 1px stroke icons — Lucide-ish
const I = {
  home:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10l9-7 9 7v11a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2z"/></svg>,
  chart:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 20h18M7 16V8M12 16v-5M17 16v-9"/></svg>,
  folder: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>,
  clock:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>,
  settings:(s=16)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09A1.65 1.65 0 0015 4.6a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  plus:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  minus:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5 12h14"/></svg>,
  play:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4l14 8-14 8z"/></svg>,
  pause:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  trend:  (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>,
  arrowUp:(s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>,
  arrowDn:(s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>,
  flame:  (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s4 4 4 8a4 4 0 01-8 0c0-1 .5-2 1-2.5-.5 2 .5 3 1 3 0-2 2-4 2-8.5zM6 14a6 6 0 0012 0c0 3-2 8-6 8s-6-5-6-8z"/></svg>,
  dot:    (s=6)  => <svg width={s} height={s} viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor"/></svg>,
  close:  (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  chevron:(s=12) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  download:(s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v13M7 11l5 5 5-5M4 21h16"/></svg>,
  trophy: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0zM7 4H4v2a3 3 0 003 3M17 4h3v2a3 3 0 01-3 3"/></svg>,
  sparkle:(s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
  target: (s=14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>,
  menu:   (s=18) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  search: (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
  bell:   (s=16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0112 0c0 7 3 7 3 9H3c0-2 3-2 3-9zM10 21a2 2 0 004 0"/></svg>,
  calendar:(s=14)=><svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="1"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>,
};

// Line chart — two overlaid series. Expects arrays newest-first.
function LineChart({ a, b, width = 560, height = 160, padX = 0, padY = 14, labels = ['A', 'B'], colors = ['#fafafa', '#737373'], showAxis = true }) {
  const data = React.useMemo(() => {
    const A = [...a].reverse();
    const B = [...b].reverse();
    const n = A.length;
    const max = Math.max(...A, ...B, 8);
    const toX = (i) => padX + (i / (n - 1)) * (width - padX * 2);
    const toY = (v) => height - padY - (v / max) * (height - padY * 2);
    const path = (arr) => arr.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`).join(' ');
    const area = (arr) => `${path(arr)} L ${toX(n - 1)} ${height - padY} L ${toX(0)} ${height - padY} Z`;
    return { A, B, n, max, toX, toY, path, area };
  }, [a, b, width, height, padX, padY]);

  const gridLines = [0.25, 0.5, 0.75];
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {showAxis && gridLines.map((g, i) => (
        <line key={i} x1={padX} x2={width - padX} y1={padY + g * (height - padY * 2)} y2={padY + g * (height - padY * 2)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      <defs>
        <linearGradient id="areaA" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={colors[0]} stopOpacity="0.12" />
          <stop offset="100%" stopColor={colors[0]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={data.area(data.A)} fill="url(#areaA)" />
      <path d={data.path(data.B)} stroke={colors[1]} strokeWidth="1" fill="none" strokeDasharray="3 3" />
      <path d={data.path(data.A)} stroke={colors[0]} strokeWidth="1.4" fill="none" />
      {data.A.map((v, i) => (
        <circle key={`a${i}`} cx={data.toX(i)} cy={data.toY(v)} r={i === data.n - 1 ? 3 : 0} fill={colors[0]} />
      ))}
    </svg>
  );
}

// Horizontal bar — used for project breakdown
function HBar({ value, max, color = '#fafafa', height = 4 }) {
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${(value / max) * 100}%`, background: color, borderRadius: 999, transition: 'width 400ms ease' }} />
    </div>
  );
}

// Heatmap — GitHub style, 13 weeks × 7 days
function Heatmap({ days, cell = 11, gap = 3 }) {
  // days[] comes newest→oldest from HEATMAP (we reverse at render)
  const data = [...days].reverse(); // oldest first, left to right
  const max = Math.max(...data.map(d => d.hours), 1);
  const weeks = [];
  for (let w = 0; w < Math.ceil(data.length / 7); w++) {
    weeks.push(data.slice(w * 7, w * 7 + 7));
  }
  const intensity = (h) => {
    if (h === 0) return 'rgba(255,255,255,0.04)';
    const lvl = Math.min(4, Math.ceil((h / max) * 4));
    const steps = [0.12, 0.22, 0.4, 0.65, 0.95];
    return `rgba(250,250,250,${steps[lvl]})`;
  };
  return (
    <div style={{ display: 'flex', gap }}>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap }}>
          {week.map((d, di) => (
            <div key={di} title={`${fmt(d.hours)}`} style={{
              width: cell, height: cell, background: intensity(d.hours), borderRadius: 2,
            }} />
          ))}
          {/* pad short weeks */}
          {Array.from({ length: 7 - week.length }).map((_, i) => (
            <div key={`pad${i}`} style={{ width: cell, height: cell }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// Donut — simple, 2-segment or multi
function Donut({ segments, size = 88, thickness = 10 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const frac = seg.value / total;
        const dash = `${frac * c} ${c}`;
        const offset = -acc * c;
        acc += frac;
        return (
          <circle key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none" stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={dash} strokeDashoffset={offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            style={{ transition: 'stroke-dasharray 400ms ease' }}
          />
        );
      })}
    </svg>
  );
}

// Progress ring
function Ring({ value, size = 48, thickness = 4, trackColor = 'rgba(255,255,255,0.08)', color = '#fafafa', children }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={thickness} />
        <circle cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth={thickness}
          strokeDasharray={`${v * c} ${c}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 500ms ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 10 }}>{children}</div>
    </div>
  );
}

// Avatar — monogram
function Avatar({ name, size = 22, active = false }) {
  const initials = USERS[name]?.initials ?? '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: active ? '#fafafa' : 'rgba(255,255,255,0.08)',
      color: active ? '#0a0a0a' : 'rgba(250,250,250,0.85)',
      fontSize: size * 0.42, fontWeight: 600,
      display: 'grid', placeItems: 'center',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.06)',
      letterSpacing: 0,
      flexShrink: 0,
    }}>{initials}</div>
  );
}

Object.assign(window, { fmt, fmtDiff, pct, I, LineChart, HBar, Heatmap, Donut, Ring, Avatar });
