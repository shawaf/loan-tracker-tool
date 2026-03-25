/**
 * render.js
 * All DOM rendering. Each function reads from global `state`
 * and a pre-built `schedule` array where needed.
 */

let chartBal = null;
let chartBar = null;

/* ── MAIN ENTRY ─────────────────────────────────────────────────────── */
function render() {
  if (!state.loans.length) { renderEmpty(); return; }

  const sched     = buildSchedule();
  const paidRows  = sched.filter(r => r.isPaid);
  const paidAmt   = paidRows.reduce((s, r) => s + r.total, 0);
  const remAmt    = Math.max(0, total() - paidAmt);
  const pct       = total() > 0 ? Math.round(paidAmt / total() * 100) : 0;
  const moLeft    = Math.max(0, sched.length - paidRows.length);
  const done      = sched.length ? sched[sched.length - 1].date : '—';

  renderHeader(pct, moLeft, sched.length);
  renderHero(paidAmt, remAmt, pct, moLeft, done, sched.length);
  renderLoanCards(sched);
  renderCheckboxes(sched);
  renderTable(sched);
  renderCharts(sched);
}

/* ── EMPTY STATE ────────────────────────────────────────────────────── */
function renderEmpty() {
  document.getElementById('header-status').textContent = 'No loans';
  document.getElementById('header-sub').textContent    = 'Mohamed Elshawaf · no active loans';
  document.getElementById('hero-amount').textContent   = 'EGP 0';
  document.getElementById('hero-sub2').textContent     = 'Add a loan to get started';
  ['hs-rem','hs-paid','hs-mo','hs-pct'].forEach(id => document.getElementById(id).textContent = '—');

  document.getElementById('loan-cards').innerHTML = addLoanCardHTML();
  document.getElementById('checks-grid').innerHTML = '';
  document.getElementById('tbl-head').innerHTML   = '';
  document.getElementById('tbl-body').innerHTML   = '';
  document.getElementById('leg-bal').innerHTML    = '';
  document.getElementById('leg-bar').innerHTML    = '';

  if (chartBal) { chartBal.destroy(); chartBal = null; }
  if (chartBar) { chartBar.destroy(); chartBar = null; }
}

/* ── HEADER ─────────────────────────────────────────────────────────── */
function renderHeader(pct, moLeft, totalMonths) {
  document.getElementById('header-status').textContent =
    state.checked && Object.values(state.checked).some(Boolean)
      ? `${pct}% cleared · ${moLeft} months left`
      : `${totalMonths} months to zero`;
  document.getElementById('header-sub').textContent =
    `Mohamed Elshawaf · ${state.loans.length} active loan${state.loans.length !== 1 ? 's' : ''}`;
}

/* ── HERO ───────────────────────────────────────────────────────────── */
function renderHero(paidAmt, remAmt, pct, moLeft, done, totalMonths) {
  const displayMonths = state.mode === 'months' ? state.targetMonths : totalMonths;
  const displayDone   = state.mode === 'months'
    ? monthFull(state.targetMonths - 1)
    : done;

  document.getElementById('hero-amount').textContent = fmtE(state.monthlyPayment);
  document.getElementById('hero-sub2').textContent   = `Debt-free in ${displayMonths} month${displayMonths !== 1 ? 's' : ''} — ${displayDone}`;
  document.getElementById('hs-rem').textContent  = fmt(remAmt);
  document.getElementById('hs-paid').textContent = fmt(paidAmt);
  document.getElementById('hs-mo').textContent   = displayMonths;
  document.getElementById('hs-pct').textContent  = pct + '%';
}

/* ── LOAN CARDS ─────────────────────────────────────────────────────── */
function renderLoanCards(sched) {
  const lastPaidIdx = sched.reduce((last, r, i) => r.isPaid ? i : last, -1);
  const ref         = lastPaidIdx >= 0 ? sched[lastPaidIdx] : null;

  const cards = state.loans.map((l, li) => {
    const orig  = l.balance;
    const cur   = ref ? ref.bals[li] : orig;
    const paid  = orig - cur;
    const p     = orig > 0 ? Math.round(paid / orig * 100) : 0;
    const col   = lCol(l), bg = lBg(l), bd = lBd(l);

    return `
      <div class="loan-card" style="border-color:${bd}">
        <button class="remove-btn" onclick="removeLoan(${l.id})" title="Remove">×</button>
        <div class="lcard-header">
          <div>
            <div class="lcard-name" style="color:${col}">${l.name}</div>
            <div class="lcard-freq">${l.freq || ''}</div>
          </div>
          <span class="lcard-badge" style="background:${bg};color:${col}">${p}% paid</span>
        </div>
        <div class="lcard-stats">
          <div class="lcs"><div class="k">Still owed</div><div class="v" style="color:${col}">${fmt(cur)}</div></div>
          <div class="lcs"><div class="k">Paid</div><div class="v" style="color:var(--green)">${fmt(paid)}</div></div>
          <div class="lcs"><div class="k">Original</div><div class="v" style="color:var(--text2)">${fmt(orig)}</div></div>
          <div class="lcs">
            <div class="k">${l.fixedPayment ? 'Fixed/mo' : 'Flexible'}</div>
            <div class="v" style="color:var(--text2)">${l.fixedPayment ? fmt(l.fixedPayment) : 'proportional'}</div>
          </div>
        </div>
        <div class="prog-track"><div class="prog-fill" style="width:${p}%;background:${col}"></div></div>
        <div class="prog-labels"><span>${p}% cleared</span><span>${fmt(cur)} left</span></div>
      </div>`;
  });

  document.getElementById('loan-cards').innerHTML = cards.join('') + addLoanCardHTML();
}

function addLoanCardHTML() {
  return `
    <div class="add-loan-card" onclick="openAddModal()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add loan
    </div>`;
}

/* ── CHECKBOXES ─────────────────────────────────────────────────────── */
function renderCheckboxes(sched) {
  document.getElementById('checks-grid').innerHTML = sched.map(r => `
    <label class="check-item${r.isPaid ? ' paid' : ''}" onclick="toggleCheck(${r.month})">
      <input type="checkbox" ${r.isPaid ? 'checked' : ''} onclick="event.stopPropagation();toggleCheck(${r.month})">
      <div>
        <div class="ci-month">${r.label}</div>
        <div class="ci-amt">${fmt(state.monthlyPayment)}</div>
      </div>
    </label>`
  ).join('');
}

/* ── TABLE ──────────────────────────────────────────────────────────── */
function renderTable(sched) {
  const { loans } = state;

  document.getElementById('tbl-head').innerHTML =
    `<th>#</th><th>Date</th>` +
    loans.map(l => `<th>${l.name}</th>`).join('') +
    `<th>Total</th>` +
    loans.map(l => `<th>${l.name} bal</th>`).join('') +
    `<th>Total bal</th>`;

  document.getElementById('tbl-body').innerHTML = sched.map((r, i) => `
    <tr class="${r.isPaid ? 'paid-row' : ''}">
      <td class="lbl" style="color:var(--text3)">${i + 1}${r.isPaid ? ' ✓' : ''}</td>
      <td class="lbl">${r.date}</td>
      ${loans.map((l, li) => `<td style="color:${lCol(l)}">${fmt(r.pays[li])}</td>`).join('')}
      <td style="font-weight:600">${fmt(r.total)}</td>
      ${loans.map((l, li) => `<td class="${r.bals[li] === 0 ? 'zero' : ''}">${r.bals[li] === 0 ? '✓' : fmt(r.bals[li])}</td>`).join('')}
      <td style="font-weight:600" class="${r.totalBal === 0 ? 'zero' : ''}">${r.totalBal === 0 ? '✓' : fmt(r.totalBal)}</td>
    </tr>`
  ).join('');
}

/* ── CHARTS ─────────────────────────────────────────────────────────── */
function renderCharts(sched) {
  const { loans, isLight } = state;
  const labels = sched.map(r => r.label);
  const gc     = isLight ? 'rgba(0,0,0,0.05)'        : 'rgba(255,255,255,0.05)';
  const tc     = isLight ? '#9a9da8'                  : '#555b68';
  const tf     = { family: 'DM Mono', size: 10 };
  const tOpts  = { autoSkip: true, maxTicksLimit: 14, maxRotation: 45, color: tc, font: tf };

  // Legend HTML
  const legHtml = loans.map(l =>
    `<span><span class="legend-sq" style="background:${lCol(l)}"></span>${l.name}</span>`
  ).join('');
  document.getElementById('leg-bal').innerHTML = legHtml +
    `<span><span class="legend-sq" style="background:${tc}"></span>Total</span>`;
  document.getElementById('leg-bar').innerHTML = legHtml;

  // Balance line chart
  if (chartBal) chartBal.destroy();
  chartBal = new Chart(document.getElementById('chart-balance'), {
    type: 'line',
    data: {
      labels,
      datasets: [
        ...loans.map((l, li) => ({
          label:           l.name,
          data:            sched.map(r => r.bals[li]),
          borderColor:     lCol(l),
          backgroundColor: lBg(l),
          tension: .3, fill: true, pointRadius: 2, borderWidth: 2,
        })),
        {
          label: 'Total', data: sched.map(r => r.totalBal),
          borderColor: tc, borderDash: [4, 3],
          tension: .3, fill: false, pointRadius: 2, borderWidth: 1.5,
        },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { callback: v => Math.round(v / 1000) + 'k', color: tc, font: tf }, grid: { color: gc }, border: { display: false } },
        x: { ticks: tOpts, grid: { display: false }, border: { display: false } },
      },
    },
  });

  // Payment stacked bar chart
  if (chartBar) chartBar.destroy();
  chartBar = new Chart(document.getElementById('chart-bar'), {
    type: 'bar',
    data: {
      labels,
      datasets: loans.map((l, li) => ({
        label:           l.name,
        data:            sched.map(r => r.pays[li]),
        backgroundColor: lCol(l) + 'bb',
        borderRadius:    3,
      })),
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { stacked: true, ticks: tOpts, grid: { display: false }, border: { display: false } },
        y: { stacked: true, ticks: { callback: v => Math.round(v / 1000) + 'k', color: tc, font: tf }, grid: { color: gc }, border: { display: false } },
      },
    },
  });
}
