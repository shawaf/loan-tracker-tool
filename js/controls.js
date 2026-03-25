/**
 * controls.js
 * Handles all user input: theme toggle, payment mode, sliders,
 * start date picker, and checkbox interactions.
 */

/* ── THEME ──────────────────────────────────────────────────────────── */
function toggleTheme() {
  state.isLight = !state.isLight;
  document.body.classList.toggle('dark', !state.isLight);
  document.getElementById('theme-label').textContent = state.isLight ? 'Dark' : 'Light';
  render();
}

/* ── PAYMENT MODE ───────────────────────────────────────────────────── */
function setMode(m, btn) {
  state.mode = m;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('ctrl-monthly').style.display = m === 'monthly' ? '' : 'none';
  document.getElementById('ctrl-months').style.display  = m === 'months'  ? '' : 'none';
  if (m === 'months') recompute();
  render();
}

/* ── MONTHLY AMOUNT ─────────────────────────────────────────────────── */
function syncMonthly(v) {
  state.monthlyPayment = Math.max(1000, parseInt(v) || 0);
  document.getElementById('sl-monthly').value = Math.min(state.monthlyPayment, 1000000);
  document.getElementById('in-monthly').value = state.monthlyPayment;
  render();
}

/* ── TARGET MONTHS ──────────────────────────────────────────────────── */
function syncMonths(v) {
  state.targetMonths = parseInt(v) || 1;
  document.getElementById('sl-months').value        = state.targetMonths;
  document.getElementById('out-months').textContent =
    state.targetMonths + ' month' + (state.targetMonths > 1 ? 's' : '');
  recompute();
  // Keep the monthly number input in sync so it reflects the computed amount
  document.getElementById('in-monthly').value = state.monthlyPayment;
  render();
}

/** Recalculate monthlyPayment from targetMonths */
function recompute() {
  state.monthlyPayment = total() > 0 ? Math.ceil(total() / state.targetMonths) : 0;
}

/* ── START DATE ─────────────────────────────────────────────────────── */
function syncStartDate() {
  state.startMonth = parseInt(document.getElementById('sel-month').value);
  state.startYear  = parseInt(document.getElementById('sel-year').value);
  state.checked    = {};   // reset checkboxes — dates changed
  render();
}

/* ── CHECKBOXES ─────────────────────────────────────────────────────── */
function toggleCheck(month) {
  state.checked[month] = !state.checked[month];
  render();
}

function clearAll() {
  state.checked = {};
  render();
}
