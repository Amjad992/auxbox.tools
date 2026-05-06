import {describe, it, expect} from 'vitest';
import {splitBill} from './utils';
import {SHARED_ASSIGNMENT} from './constants';

const P = (id, name) => ({id, name});

describe('splitBill', () => {
  it('single person, single item: total = item amount', () => {
    const r = splitBill({
      people: [P('p1', 'A')],
      items: [{id: 'i1', label: 'X', amount: 50, assignedTo: 'p1'}],
      taxPct: 0,
      tipPct: 0,
    });
    expect(r.totals.grandTotal).toBe(50);
    expect(r.perPerson[0].total).toBe(50);
  });

  it('two people, two assigned items + tax + tip proportional', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B')],
      items: [
        {id: 'i1', label: 'A meal', amount: 30, assignedTo: 'p1'},
        {id: 'i2', label: 'B meal', amount: 20, assignedTo: 'p2'},
      ],
      taxPct: 10,
      tipPct: 20,
    });
    // subtotal 50, tax 5, tip 10, grand 65
    expect(r.totals.subtotal).toBe(50);
    expect(r.totals.tax).toBeCloseTo(5, 5);
    expect(r.totals.tip).toBeCloseTo(10, 5);
    expect(r.totals.grandTotal).toBeCloseTo(65, 5);
    // Person A: 30 + 30/50*5 + 30/50*10 = 30 + 3 + 6 = 39
    // Person B: 20 + 2 + 4 = 26
    expect(r.perPerson[0].total).toBeCloseTo(39, 5);
    expect(r.perPerson[1].total).toBeCloseTo(26, 5);
  });

  it('shared items split equally across all people', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B'), P('p3', 'C')],
      items: [
        {id: 'i1', label: 'Wine', amount: 30, assignedTo: SHARED_ASSIGNMENT},
      ],
      taxPct: 0,
      tipPct: 0,
    });
    expect(r.perPerson.every((p) => p.subtotal === 10)).toBe(true);
    expect(r.totals.grandTotal).toBe(30);
  });

  it('mixed personal + shared items', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B')],
      items: [
        {id: 'i1', label: 'Wine', amount: 20, assignedTo: SHARED_ASSIGNMENT},
        {id: 'i2', label: 'A main', amount: 30, assignedTo: 'p1'},
        {id: 'i3', label: 'B main', amount: 25, assignedTo: 'p2'},
      ],
      taxPct: 0,
      tipPct: 0,
    });
    // Shared 20 split 10/10. A: 30 + 10 = 40; B: 25 + 10 = 35.
    expect(r.perPerson[0].subtotal).toBe(40);
    expect(r.perPerson[1].subtotal).toBe(35);
    expect(r.totals.subtotal).toBe(75);
  });

  it('round-trip: per-person totals sum to grandTotal', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B'), P('p3', 'C')],
      items: [
        {id: 'i1', label: 'a1', amount: 17.5, assignedTo: 'p1'},
        {id: 'i2', label: 'a2', amount: 22.33, assignedTo: 'p2'},
        {id: 'i3', label: 'a3', amount: 9.4, assignedTo: 'p3'},
        {id: 'i4', label: 'shared', amount: 14, assignedTo: SHARED_ASSIGNMENT},
      ],
      taxPct: 8.5,
      tipPct: 18,
    });
    const sumOfPerPerson = r.perPerson.reduce((s, p) => s + p.total, 0);
    expect(sumOfPerPerson).toBeCloseTo(r.totals.grandTotal, 5);
  });

  it('zero items: all zeros', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B')],
      items: [],
      taxPct: 10,
      tipPct: 20,
    });
    expect(r.totals.grandTotal).toBe(0);
    expect(r.perPerson.every((p) => p.total === 0)).toBe(true);
  });

  it('zero people: empty perPerson + zero totals', () => {
    const r = splitBill({
      people: [],
      items: [{id: 'i1', label: 'x', amount: 30, assignedTo: 'ghost'}],
      taxPct: 10,
      tipPct: 10,
    });
    expect(r.perPerson).toEqual([]);
    expect(r.totals.grandTotal).toBe(0);
  });

  it('item assigned to removed person is treated as shared', () => {
    const r = splitBill({
      people: [P('p1', 'A'), P('p2', 'B')],
      items: [
        {id: 'i1', label: 'orphan', amount: 20, assignedTo: 'gone'},
      ],
      taxPct: 0,
      tipPct: 0,
    });
    expect(r.perPerson[0].subtotal).toBe(10);
    expect(r.perPerson[1].subtotal).toBe(10);
  });

  it('skips invalid item amounts', () => {
    const r = splitBill({
      people: [P('p1', 'A')],
      items: [
        {id: 'i1', label: 'good', amount: 25, assignedTo: 'p1'},
        {id: 'i2', label: 'bad', amount: 'x', assignedTo: 'p1'},
        {id: 'i3', label: 'neg', amount: -5, assignedTo: 'p1'},
      ],
      taxPct: 0,
      tipPct: 0,
    });
    expect(r.perPerson[0].subtotal).toBe(25);
  });

  it('clamps tax/tip percent to [0, 100]', () => {
    const r = splitBill({
      people: [P('p1', 'A')],
      items: [{id: 'i1', label: 'X', amount: 100, assignedTo: 'p1'}],
      taxPct: -10,
      tipPct: 200,
    });
    expect(r.totals.tax).toBe(0);
    expect(r.totals.tip).toBe(100); // clamped to 100%
  });
});
