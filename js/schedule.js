/**
 * schedule.js
 * Builds the full repayment schedule from current state.
 *
 * Rules:
 *  - Fixed-payment loans pay AT LEAST their fixed amount (minimum payment).
 *  - Any budget remaining after all minimums are covered is split
 *    proportionally across ALL loans still with a balance —
 *    so higher payments accelerate every loan, not just flexible ones.
 *  - Checkboxes mark months as paid but never change payment amounts.
 */

function buildSchedule() {
  const { loans, monthlyPayment, checked } = state;
  if (!loans.length) return [];

  let balances = loans.map(l => l.balance);
  const rows = [];
  let month = 0;

  while (balances.some(b => b > 0.5) && month < 120) {
    const pays = loans.map(() => 0);

    // Step 1 — collect minimum payments for fixed-payment loans
    let minTotal = 0;
    loans.forEach((l, i) => {
      if (l.fixedPayment && balances[i] > 0.5) {
        const min = Math.min(l.fixedPayment, balances[i]);
        pays[i]   = min;
        minTotal += min;
      }
    });

    // Step 2 — split any surplus budget proportionally across ALL active loans
    const surplus = Math.max(0, monthlyPayment - minTotal);
    if (surplus > 0.5) {
      const activeTotal = balances.reduce((s, b, i) => b > 0.5 ? s + (balances[i] - pays[i]) : s, 0);
      if (activeTotal > 0.5) {
        loans.forEach((l, i) => {
          const remaining = balances[i] - pays[i];
          if (remaining > 0.5) {
            pays[i] += Math.min(remaining, surplus * (remaining / activeTotal));
          }
        });
      }
    }

    // Apply payments
    balances = balances.map((b, i) => Math.max(0, b - pays[i]));

    rows.push({
      month,
      date:     monthFull(month),
      label:    monthLabel(month),
      pays:     pays.map(p => Math.round(p)),
      total:    Math.round(pays.reduce((s, p) => s + p, 0)),
      bals:     balances.map(b => Math.round(b)),
      totalBal: Math.round(balances.reduce((s, b) => s + b, 0)),
      isPaid:   !!checked[month],
    });

    month++;
  }

  return rows;
}
