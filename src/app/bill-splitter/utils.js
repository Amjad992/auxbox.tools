// Bill Splitter — pure math.

import {SHARED_ASSIGNMENT} from './constants';

/**
 * Split a bill across people with mixed individual + shared items, then
 * proportionally distribute tax and tip across each person's subtotal.
 *
 * Algorithm:
 *   1. For each person p, sum items where assignedTo === p.id.
 *   2. Sum 'shared' items, divide equally across all people.
 *   3. subtotal_i = personalItems_i + sharedShare_i.
 *   4. subtotal = sum(subtotal_i).
 *   5. tax = subtotal × (taxPct / 100). Each person's taxShare =
 *      (subtotal_i / subtotal) × tax. Falls back to equal split when
 *      subtotal is 0 (avoids NaN; matches user expectation).
 *   6. tipShare follows the same proportional rule.
 *   7. total_i = subtotal_i + taxShare_i + tipShare_i.
 *
 * Returns `{perPerson: [...], totals: {subtotal, tax, tip, grandTotal}}`.
 *
 * Items assigned to a removed person ID are silently treated as 'shared'
 * so a half-edited state still produces sane output.
 */
export function splitBill({people, items, taxPct, tipPct}) {
  const validPeople = Array.isArray(people) ? people : [];
  const validItems = Array.isArray(items) ? items : [];
  const peopleIds = new Set(validPeople.map((p) => p.id));
  const numPeople = validPeople.length;

  let personalSubtotals = Object.fromEntries(
    validPeople.map((p) => [p.id, 0])
  );
  let sharedSum = 0;

  for (const item of validItems) {
    if (!item) continue;
    const amt = num(item.amount);
    if (!Number.isFinite(amt) || amt <= 0) continue;
    if (
      item.assignedTo === SHARED_ASSIGNMENT ||
      !peopleIds.has(item.assignedTo)
    ) {
      sharedSum += amt;
    } else {
      personalSubtotals[item.assignedTo] =
        (personalSubtotals[item.assignedTo] || 0) + amt;
    }
  }

  const sharedPerPerson = numPeople > 0 ? sharedSum / numPeople : 0;

  const perPersonSubtotals = validPeople.map((p) => ({
    personId: p.id,
    name: p.name,
    subtotal: (personalSubtotals[p.id] || 0) + sharedPerPerson,
  }));

  const subtotal = perPersonSubtotals.reduce((s, p) => s + p.subtotal, 0);
  const taxRate = clampPct(taxPct);
  const tipRate = clampPct(tipPct);
  const tax = subtotal * taxRate;
  const tip = subtotal * tipRate;

  const perPerson = perPersonSubtotals.map((p) => {
    let taxShare;
    let tipShare;
    if (subtotal > 0) {
      taxShare = (p.subtotal / subtotal) * tax;
      tipShare = (p.subtotal / subtotal) * tip;
    } else {
      taxShare = numPeople > 0 ? tax / numPeople : 0;
      tipShare = numPeople > 0 ? tip / numPeople : 0;
    }
    return {
      personId: p.personId,
      name: p.name,
      subtotal: p.subtotal,
      taxShare,
      tipShare,
      total: p.subtotal + taxShare + tipShare,
    };
  });

  return {
    perPerson,
    totals: {
      subtotal,
      tax,
      tip,
      grandTotal: subtotal + tax + tip,
    },
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

function clampPct(p) {
  const v = num(p);
  if (v <= 0) return 0;
  if (v >= 100) return 1;
  return v / 100;
}

let nextIdCounter = 0;
export function newId(prefix = 'i') {
  // Time-prefixed + counter to avoid collisions across rapid re-renders.
  return `${prefix}${Date.now().toString(36)}-${++nextIdCounter}`;
}
