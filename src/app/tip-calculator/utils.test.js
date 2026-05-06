import {describe, it, expect} from 'vitest';
import {calculateTip} from './utils';

describe('calculateTip', () => {
  it('100 × 18% over 4 people', () => {
    const r = calculateTip({bill: 100, tipPct: 18, people: 4});
    expect(r.tipAmount).toBeCloseTo(18, 5);
    expect(r.total).toBeCloseTo(118, 5);
    expect(r.perPerson).toBeCloseTo(29.5, 5);
    expect(r.perPersonTip).toBeCloseTo(4.5, 5);
  });

  it('zero bill yields zero everything', () => {
    const r = calculateTip({bill: 0, tipPct: 20, people: 2});
    expect(r.tipAmount).toBe(0);
    expect(r.total).toBe(0);
    expect(r.perPerson).toBe(0);
  });

  it('zero tip pct → total equals bill, perPersonTip is 0', () => {
    const r = calculateTip({bill: 60, tipPct: 0, people: 3});
    expect(r.total).toBe(60);
    expect(r.tipAmount).toBe(0);
    expect(r.perPerson).toBeCloseTo(20, 5);
    expect(r.perPersonTip).toBe(0);
  });

  it('clamps people to at least 1', () => {
    const r = calculateTip({bill: 100, tipPct: 10, people: 0});
    expect(r.people).toBe(1);
    expect(r.perPerson).toBeCloseTo(110, 5);
  });

  it('floors fractional people input', () => {
    const r = calculateTip({bill: 100, tipPct: 0, people: 2.7});
    expect(r.people).toBe(2);
    expect(r.perPerson).toBe(50);
  });

  it('round-trip: perPerson × people = total', () => {
    const r = calculateTip({bill: 73.45, tipPct: 22, people: 5});
    expect(r.perPerson * r.people).toBeCloseTo(r.total, 5);
  });

  it('coerces string inputs', () => {
    const r = calculateTip({bill: '100', tipPct: '15', people: '2'});
    expect(r.total).toBeCloseTo(115, 5);
    expect(r.perPerson).toBeCloseTo(57.5, 5);
  });

  it('handles non-finite inputs gracefully', () => {
    const r = calculateTip({bill: NaN, tipPct: Infinity, people: 'x'});
    expect(r.total).toBe(0);
    expect(r.tipAmount).toBe(0);
    expect(r.people).toBe(1);
  });
});
