/* ── PALETTE ────────────────────────────────────────────────────────── */
const PALETTE = [
  ['#1a6fd4', '#4a9eff'],
  ['#1a8a5a', '#3ecf8e'],
  ['#6d4fd4', '#a78bfa'],
  ['#b8860b', '#f5c542'],
  ['#c0392b', '#f87171'],
  ['#1a7a8a', '#3ecfcf'],
  ['#7a5a1a', '#cfaa3e'],
  ['#7a1a8a', '#d47af5'],
];

/* ── DEFAULT LOANS ──────────────────────────────────────────────────── */
const DEFAULT_LOANS = [
  { id: 1, name: 'Apartment',     balance: 2274032, freq: 'Monthly (converted from quarterly)', colorIdx: 0, fixedPayment: null  },
  { id: 2, name: 'Car Murabaha',  balance: 1183945, freq: 'Monthly · Bank installment',         colorIdx: 1, fixedPayment: 69645 },
  { id: 3, name: 'Personal loan', balance: 21117,   freq: 'Monthly · ends Jul 2026',            colorIdx: 2, fixedPayment: 5519  },
];

/* ── APP STATE ──────────────────────────────────────────────────────── */
let state = {
  loans:          DEFAULT_LOANS.map(l => ({ ...l })),
  nextId:         4,
  isLight:        true,
  mode:           'monthly',       // 'monthly' | 'months'
  monthlyPayment: 293684,
  targetMonths:   12,
  checked:        {},              // { [monthOffset]: boolean }
  startMonth:     2,               // 0-indexed (2 = March)
  startYear:      2026,
  selColor:       0,               // selected color index in modal
};

/* ── HELPERS ────────────────────────────────────────────────────────── */
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmt   = n  => Math.round(n).toLocaleString('en-US');
const fmtE  = n  => 'EGP ' + fmt(n);
const total = () => state.loans.reduce((s, l) => s + l.balance, 0);

/** Resolved color for a loan given current theme */
const lCol = l => PALETTE[l.colorIdx][state.isLight ? 0 : 1];
/** Light translucent fill */
const lBg  = l => PALETTE[l.colorIdx][0] + '18';
/** Light translucent border */
const lBd  = l => PALETTE[l.colorIdx][0] + '44';

const monthLabel = offset => {
  const d = new Date(state.startYear, state.startMonth + offset, 1);
  return MONTHS[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2);
};
const monthFull = offset => {
  const d = new Date(state.startYear, state.startMonth + offset, 1);
  return MONTHS[d.getMonth()] + ' ' + d.getFullYear();
};
