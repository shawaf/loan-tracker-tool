/**
 * modal.js
 * Handles the Add Loan modal: open, close, color swatches, save, and remove.
 */

/* ── OPEN ───────────────────────────────────────────────────────────── */
function openAddModal() {
  document.getElementById('modal-title').textContent  = 'Add loan';
  document.getElementById('btn-save').textContent     = 'Add loan';
  document.getElementById('f-name').value             = '';
  document.getElementById('f-balance').value          = '';
  document.getElementById('f-freq').value             = '';
  document.getElementById('f-fixed').checked          = false;
  document.getElementById('f-fixed-row').style.display = 'none';
  document.getElementById('f-fixed-amt').value        = '';

  // Pick next unused color
  state.selColor = state.loans.length % PALETTE.length;
  renderSwatches();

  document.getElementById('modal').style.display = 'flex';
  setTimeout(() => document.getElementById('f-name').focus(), 60);
}

/* ── CLOSE ──────────────────────────────────────────────────────────── */
function closeModal() {
  document.getElementById('modal').style.display = 'none';
}

/* ── COLOR SWATCHES ─────────────────────────────────────────────────── */
function renderSwatches() {
  document.getElementById('swatches').innerHTML = PALETTE.map((c, i) => `
    <div
      class="swatch${i === state.selColor ? ' sel' : ''}"
      style="background:${c[state.isLight ? 0 : 1]}"
      onclick="selectColor(${i})"
    ></div>`
  ).join('');
}

function selectColor(i) {
  state.selColor = i;
  renderSwatches();
}

/* ── SAVE ───────────────────────────────────────────────────────────── */
function saveLoan() {
  const name      = document.getElementById('f-name').value.trim();
  const balance   = parseFloat(document.getElementById('f-balance').value) || 0;
  const freq      = document.getElementById('f-freq').value.trim();
  const isFixed   = document.getElementById('f-fixed').checked;
  const fixedAmt  = isFixed ? (parseFloat(document.getElementById('f-fixed-amt').value) || null) : null;

  if (!name)       { alert('Please enter a loan name.');                         return; }
  if (balance <= 0){ alert('Please enter a valid balance greater than 0.');       return; }
  if (isFixed && !fixedAmt) { alert('Please enter the fixed monthly payment amount.'); return; }

  state.loans.push({
    id:           state.nextId++,
    name,
    balance,
    freq,
    colorIdx:     state.selColor,
    fixedPayment: fixedAmt,
  });

  state.checked = {};
  closeModal();
  render();
}

/* ── REMOVE ─────────────────────────────────────────────────────────── */
function removeLoan(id) {
  const loan = state.loans.find(l => l.id === id);
  if (!loan) return;
  if (!confirm(`Remove "${loan.name}" from the tracker?`)) return;

  state.loans   = state.loans.filter(l => l.id !== id);
  state.checked = {};
  render();
}
