// Mock data for the productivity tracker — Diego & Ismaël on "My Folio"

const USERS = {
  diego:   { id: 'diego',   name: 'Diego',   initials: 'D', weeklyGoal: 40, monthlyGoal: 160 },
  ismael:  { id: 'ismael',  name: 'Ismaël',  initials: 'I', weeklyGoal: 40, monthlyGoal: 160 },
};

const CURRENT = 'diego';
const RIVAL   = 'ismael';

// 30 days of entries. index 0 = today, 29 = 30 days ago.
// We generate deterministic-looking data.
function genSeries() {
  // [diego, ismael] hours per day, most recent first
  const diego  = [6.5, 7.25, 8.0, 5.5, 0, 0, 9.25, 7.5, 6.0, 8.25, 4.5, 0, 0, 7.0, 6.75, 8.5, 5.25, 7.0, 0, 0, 6.5, 8.0, 5.0, 7.25, 6.0, 0, 0, 5.5, 7.0, 6.25];
  const ismael = [4.25, 9.5, 7.75, 7.0, 2.5, 0, 8.0, 6.5, 7.25, 9.0, 6.25, 0, 0, 8.5, 5.5, 7.0, 6.5, 8.0, 1.0, 0, 7.25, 6.75, 5.5, 8.0, 7.0, 0, 0, 6.25, 7.5, 5.75];
  return { diego, ismael };
}
const SERIES = genSeries();

// Sum helpers
const sum = (arr, n = arr.length) => arr.slice(0, n).reduce((a, b) => a + b, 0);

const TODAY = {
  diego:  SERIES.diego[0],
  ismael: SERIES.ismael[0],
};
const WEEK = {
  diego:  sum(SERIES.diego, 7),
  ismael: sum(SERIES.ismael, 7),
};
const MONTH = {
  diego:  sum(SERIES.diego, 30),
  ismael: sum(SERIES.ismael, 30),
};

// Streak = consecutive days with ≥1h, starting from today
function streak(arr) {
  let n = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] >= 1) n++; else break;
  }
  return n;
}
const STREAK = {
  diego:  streak(SERIES.diego),
  ismael: streak(SERIES.ismael),
};

// Projects — simplified to "My Folio" sub-modules since user said single project
const PROJECTS = [
  { id: 'folio-core',   name: 'My Folio — Core',        hours: { diego: 42.5,  ismael: 38.25 }, color: '#fafafa' },
  { id: 'folio-editor', name: 'My Folio — Editor',      hours: { diego: 28.0,  ismael: 31.5  }, color: '#a3a3a3' },
  { id: 'folio-api',    name: 'My Folio — API',         hours: { diego: 18.75, ismael: 24.0  }, color: '#737373' },
  { id: 'folio-mkt',    name: 'My Folio — Marketing',   hours: { diego: 9.25,  ismael: 12.5  }, color: '#525252' },
  { id: 'admin',        name: 'Admin & Ops',            hours: { diego: 6.5,   ismael: 4.25  }, color: '#404040' },
];

// Recent entries (last 10, mixed)
const RECENT = [
  { id: 1,  user: 'diego',  project: 'folio-core',   hours: 3.5,  date: "Aujourd'hui 14:20", note: 'Refactor du composant ProjectCard, nouveau layout grid' },
  { id: 2,  user: 'ismael', project: 'folio-editor', hours: 2.0,  date: "Aujourd'hui 11:05", note: 'Fix du bug de drag sur Safari' },
  { id: 3,  user: 'diego',  project: 'folio-core',   hours: 3.0,  date: "Aujourd'hui 09:30", note: 'Setup de la session de travail' },
  { id: 4,  user: 'ismael', project: 'folio-api',    hours: 2.25, date: 'Hier 17:40',        note: 'Endpoint /projects avec filtres' },
  { id: 5,  user: 'diego',  project: 'folio-editor', hours: 4.25, date: 'Hier 14:10',        note: 'Gestion des versions — brouillon' },
  { id: 6,  user: 'ismael', project: 'folio-core',   hours: 5.25, date: 'Hier 10:00',        note: 'Migration TS strict + typage de la sidebar' },
  { id: 7,  user: 'diego',  project: 'folio-core',   hours: 3.0,  date: 'Lundi 16:20',       note: '' },
  { id: 8,  user: 'ismael', project: 'folio-mkt',    hours: 1.5,  date: 'Lundi 11:30',       note: 'Landing — copy v3' },
  { id: 9,  user: 'diego',  project: 'folio-api',    hours: 5.0,  date: 'Lundi 09:15',       note: 'Auth — magic link flow complet' },
  { id: 10, user: 'ismael', project: 'folio-editor', hours: 6.25, date: 'Dimanche 13:00',    note: 'Marathon — toolbar + shortcuts' },
];

// Badges / achievements
const BADGES = [
  { id: 'streak7',   label: '7 jours de suite',     earned: true,  when: 'il y a 2 jours' },
  { id: 'early',     label: 'Lève-tôt (avant 8h)',  earned: true,  when: 'cette semaine' },
  { id: 'marathon',  label: '10h en 1 jour',        earned: false, when: null },
  { id: 'month160',  label: '160h ce mois',         earned: false, when: null, progress: 0.78 },
  { id: 'firstplace',label: '#1 de la semaine',     earned: false, when: null },
  { id: 'consistent',label: '30 jours / 30',        earned: false, when: null, progress: 0.66 },
];

// Heatmap — 91 days (13 weeks), most recent = bottom-right
function genHeatmap() {
  const days = [];
  for (let i = 90; i >= 0; i--) {
    if (i < 30) {
      const h = SERIES.diego[i];
      days.push({ offset: i, hours: h });
    } else {
      // synthetic older data — decreasing intensity
      const seed = (i * 37) % 11;
      const h = seed < 2 ? 0 : (seed - 1) * 0.9 + Math.sin(i) * 0.8 + 3;
      days.push({ offset: i, hours: Math.max(0, Math.round(h * 2) / 2) });
    }
  }
  return days;
}
const HEATMAP = genHeatmap();

Object.assign(window, {
  USERS, CURRENT, RIVAL, SERIES, TODAY, WEEK, MONTH, STREAK,
  PROJECTS, RECENT, BADGES, HEATMAP,
});
