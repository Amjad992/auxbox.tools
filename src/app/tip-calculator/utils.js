// Tip Calculator — pure math.

export function calculateTip({bill, tipPct, people}) {
  // Clamp negative bills to zero — typed/pasted negatives bypass `min="0"`
  // on the input, and propagating them produces nonsensical negative tips.
  const b = Math.max(0, num(bill));
  const t = num(tipPct);
  const p = Math.max(1, Math.floor(num(people)));
  const tipAmount = b * (t / 100);
  const total = b + tipAmount;
  return {
    bill: b,
    tipPct: t,
    people: p,
    tipAmount,
    total,
    perPerson: total / p,
    perPersonTip: tipAmount / p,
  };
}

function num(x) {
  if (typeof x === 'number') return Number.isFinite(x) ? x : 0;
  if (typeof x === 'string' && x.trim() !== '') {
    const v = parseFloat(x);
    return Number.isFinite(v) ? v : 0;
  }
  return 0;
}
