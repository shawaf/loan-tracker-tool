/**
 * export.js
 * Generates and downloads a PDF report of the current loan tracker state.
 * Always renders in light mode for cleaner print output.
 */

async function exportPDF() {
  const btn = document.getElementById('pdf-btn');
  btn.innerHTML = '<span>Generating…</span>';
  btn.disabled  = true;

  // Temporarily switch to light mode for clean PDF rendering
  const wasLight = state.isLight;
  if (!wasLight) {
    state.isLight = true;
    document.body.classList.remove('dark');
    render();
  }
  await new Promise(r => setTimeout(r, 350));

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pw = 210, ph = 297, mg = 10, cw = pw - mg * 2;
  let y = mg;

  /* ── PAGE HEADER ────────────────────────────────────────────────── */
  pdf.setFillColor(245, 245, 243);
  pdf.rect(0, 0, pw, 19, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(17, 18, 19);
  pdf.text('Loan Tracker — Mohamed Elshawaf', mg, 12);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(120, 120, 130);
  const now = new Date();
  pdf.text(
    `${now.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })} · Start: ${monthFull(0)} · EGP ${fmt(state.monthlyPayment)}/mo`,
    pw - mg, 12, { align: 'right' }
  );
  y = 25;

  /* ── SUMMARY BOXES ──────────────────────────────────────────────── */
  const sched    = buildSchedule();
  const paidAmt  = sched.filter(r => r.isPaid).reduce((s, r) => s + r.total, 0);
  const moLeft   = Math.max(0, sched.length - sched.filter(r => r.isPaid).length);
  const bw       = (cw - 9) / 4;

  [
    { lbl: 'Monthly payment', val: fmtE(state.monthlyPayment),              rgb: [180,135,11] },
    { lbl: 'Total remaining', val: fmtE(Math.max(0, total() - paidAmt)),    rgb: [26,111,212] },
    { lbl: 'Paid so far',     val: fmtE(paidAmt),                           rgb: [26,138,90]  },
    { lbl: 'Months left',     val: moLeft + ' months',                      rgb: [109,79,212] },
  ].forEach((b, i) => {
    const x = mg + i * (bw + 3);
    pdf.setFillColor(248, 248, 246); pdf.roundedRect(x, y, bw, 16, 2, 2, 'F');
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(140, 140, 150);
    pdf.text(b.lbl.toUpperCase(), x + bw / 2, y + 5.5, { align: 'center' });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(...b.rgb);
    pdf.text(b.val, x + bw / 2, y + 12, { align: 'center' });
  });
  y += 22;

  /* ── LOAN BREAKDOWN TABLE ───────────────────────────────────────── */
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(17, 18, 19);
  pdf.text('Loan breakdown', mg, y); y += 5;

  const lastPaidIdx = sched.reduce((last, r, i) => r.isPaid ? i : last, -1);
  const ref         = lastPaidIdx >= 0 ? sched[lastPaidIdx] : null;

  const lHeaders = ['Loan', 'Original', 'Paid', 'Remaining', '%'];
  const lWidths  = [45, 33, 33, 33, 20];
  let cx;

  pdf.setFillColor(235, 235, 232); pdf.rect(mg, y, cw, 6, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6.5); pdf.setTextColor(80, 80, 90);
  cx = mg + 2;
  lHeaders.forEach((h, i) => { pdf.text(h, cx, y + 4.5); cx += lWidths[i]; });
  y += 6;

  state.loans.forEach((l, li) => {
    if (li % 2 === 1) { pdf.setFillColor(248, 248, 246); pdf.rect(mg, y, cw, 6, 'F'); }
    const cur  = ref ? ref.bals[li] : l.balance;
    const paid = l.balance - cur;
    const p    = l.balance > 0 ? Math.round(paid / l.balance * 100) : 0;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5);
    cx = mg + 2;
    [l.name, fmtE(l.balance), fmtE(paid), fmtE(cur), p + '%'].forEach((c, ci) => {
      pdf.setTextColor(ci === 4 ? 26 : 17, ci === 4 ? 138 : 18, ci === 4 ? 90 : 19);
      pdf.text(String(c), cx, y + 4.5); cx += lWidths[ci];
    });
    y += 6;
  });
  y += 8;

  /* ── CHARTS (screenshot) ────────────────────────────────────────── */
  try {
    const canvas = await html2canvas(document.querySelector('.charts-grid'), {
      scale: 2, backgroundColor: '#f5f5f3', useCORS: true, logging: false,
    });
    const imgH = (canvas.height / canvas.width) * cw;
    if (y + imgH > ph - mg) { pdf.addPage(); y = mg; }
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', mg, y, cw, imgH);
    y += imgH + 8;
  } catch (e) { /* charts optional */ }

  /* ── REPAYMENT SCHEDULE ─────────────────────────────────────────── */
  if (y + 20 > ph - mg) { pdf.addPage(); y = mg; }
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(17, 18, 19);
  pdf.text('Full repayment schedule', mg, y); y += 5;

  const varW  = Math.max(14, Math.min(20, (cw - 28) / (state.loans.length * 2 + 2)));
  const tCols = [8, 20, ...Array(state.loans.length * 2 + 2).fill(varW)];
  const tHds  = [
    '#', 'Date',
    ...state.loans.map(l => l.name.slice(0, 7)),
    'Total',
    ...state.loans.map(l => l.name.slice(0, 5)),
    'Total',
  ];

  const drawTableHeader = () => {
    pdf.setFillColor(235, 235, 232); pdf.rect(mg, y, cw, 6, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor(80, 80, 90);
    cx = mg + 1;
    tHds.forEach((h, i) => { pdf.text(h, cx, y + 4.5); cx += tCols[i]; });
    y += 6;
  };
  drawTableHeader();

  sched.forEach((r, ri) => {
    if (y + 5.5 > ph - mg) { pdf.addPage(); y = mg; drawTableHeader(); }
    if (ri % 2 === 1)  { pdf.setFillColor(248, 248, 246); pdf.rect(mg, y, cw, 5, 'F'); }
    if (r.isPaid)      { pdf.setFillColor(235, 248, 241); pdf.rect(mg, y, cw, 5, 'F'); }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6);
    const cells = [
      String(ri + 1) + (r.isPaid ? ' ✓' : ''),
      r.date,
      ...r.pays.map(fmt),
      fmt(r.total),
      ...r.bals.map(b => b === 0 ? '✓' : fmt(b)),
      r.totalBal === 0 ? '✓' : fmt(r.totalBal),
    ];
    cx = mg + 1;
    cells.forEach((c, ci) => {
      pdf.setTextColor(r.isPaid ? 26 : 17, r.isPaid ? 138 : 18, r.isPaid ? 90 : 19);
      pdf.text(String(c), cx, y + 4); cx += tCols[ci];
    });
    y += 5;
  });

  /* ── FOOTER ─────────────────────────────────────────────────────── */
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(160, 160, 170);
  pdf.text('Generated by Loan Tracker · Mohamed Elshawaf', pw / 2, ph - 6, { align: 'center' });

  pdf.save(`loan-tracker-${now.toISOString().slice(0, 10)}.pdf`);

  /* ── RESTORE THEME ──────────────────────────────────────────────── */
  if (!wasLight) {
    state.isLight = false;
    document.body.classList.add('dark');
    render();
  }

  btn.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>Export PDF`;
  btn.disabled = false;
}
