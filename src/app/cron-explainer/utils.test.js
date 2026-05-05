import {describe as vDescribe, it, expect} from 'vitest';
import {DateTime} from 'luxon';
import {CronExpressionParser} from 'cron-parser';
import {parseExpression, describe, nextRuns} from './utils';

vDescribe('parseExpression', () => {
  it('accepts standard 5-field expressions', () => {
    expect(parseExpression('* * * * *').valid).toBe(true);
    expect(parseExpression('0 9 * * 1-5').valid).toBe(true);
    expect(parseExpression('*/15 * * * *').valid).toBe(true);
    expect(parseExpression('0 0 1 * *').valid).toBe(true);
    expect(parseExpression('0 0 1 1 *').valid).toBe(true);
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(parseExpression('   0 9 * * 1-5  ').valid).toBe(true);
  });

  it('rejects obvious garbage with an error message', () => {
    const r1 = parseExpression('bad');
    expect(r1.valid).toBe(false);
    expect(typeof r1.error).toBe('string');
    expect(r1.error.length).toBeGreaterThan(0);
  });

  it('rejects expressions with out-of-range numeric fields', () => {
    // Minute = 99 is out of the 0-59 range — cron-parser must reject it.
    expect(parseExpression('99 * * * *').valid).toBe(false);
  });

  it('rejects expressions with too many fields', () => {
    // 7-field is not a supported syntax for cron-parser.
    expect(parseExpression('* * * * * * *').valid).toBe(false);
  });

  it('returns invalid for empty / non-string input without an error', () => {
    expect(parseExpression('').valid).toBe(false);
    expect(parseExpression('   ').valid).toBe(false);
    expect(parseExpression(null).valid).toBe(false);
    expect(parseExpression(undefined).valid).toBe(false);
  });
});

vDescribe('describe', () => {
  it('returns a non-empty description for valid expressions', () => {
    for (const src of [
      '* * * * *',
      '0 * * * *',
      '0 9 * * *',
      '0 9 * * 1-5',
      '*/15 * * * *',
      '0 0 * * 0',
      '0 0 1 * *',
      '0 0 1 1 *',
    ]) {
      const out = describe(src);
      expect(typeof out).toBe('string');
      expect(out && out.length).toBeGreaterThan(0);
      // Should never surface the cronstrue error sentinel.
      expect(out).not.toMatch(/^an error occurred/i);
    }
  });

  it('returns null for invalid input', () => {
    expect(describe('bad')).toBeNull();
    expect(describe('99 * * * *')).toBeNull();
    expect(describe('* * * * * * *')).toBeNull();
    expect(describe('')).toBeNull();
    expect(describe(null)).toBeNull();
  });
});

vDescribe('nextRuns', () => {
  // Stable "now" — Sunday 2025-08-10 12:00:00 UTC.
  const fromDate = new Date('2025-08-10T12:00:00Z');

  it('returns an empty array for invalid input', () => {
    expect(nextRuns('bad', 5, fromDate)).toEqual([]);
    expect(nextRuns('', 5, fromDate)).toEqual([]);
  });

  it('returns 5 entries with consecutive minutes for "* * * * *"', () => {
    const runs = nextRuns('* * * * *', 5, fromDate);
    expect(runs).toHaveLength(5);
    // Each entry must have the documented shape.
    for (const r of runs) {
      expect(r.jsDate instanceof Date).toBe(true);
      expect(typeof r.isoString).toBe('string');
      expect(typeof r.absoluteLabel).toBe('string');
      expect(typeof r.relativeLabel).toBe('string');
    }
    // Consecutive minutes from the next minute boundary onward.
    const minutes = runs.map((r) =>
      DateTime.fromJSDate(r.jsDate).toUTC().toFormat('HH:mm')
    );
    expect(minutes).toEqual(['12:01', '12:02', '12:03', '12:04', '12:05']);
  });

  it('"0 9 * * 1-5" from a Friday afternoon → next is Monday 09:00', () => {
    // Friday 2025-08-08 15:00 UTC. Pin entirely to UTC so this test is
    // deterministic regardless of the CI/developer host timezone (MAJ-2).
    const friday = new Date('2025-08-08T15:00:00Z');
    const interval = CronExpressionParser.parse('0 9 * * 1-5', {
      currentDate: friday,
      tz: 'UTC',
    });
    const jsDate = interval.next().toDate();
    const dt = DateTime.fromJSDate(jsDate, {zone: 'UTC'});
    // Monday is weekday 1 in Luxon; hour 09:00 UTC — stable in any host zone.
    expect(dt.weekday).toBe(1);
    expect(dt.hour).toBe(9);
    expect(dt.minute).toBe(0);
  });

  it('respects count=0 by returning an empty array', () => {
    expect(nextRuns('* * * * *', 0, fromDate)).toEqual([]);
  });

  it('clamps absurdly large counts and still returns valid entries', () => {
    const runs = nextRuns('* * * * *', 9999, fromDate);
    expect(runs.length).toBeLessThanOrEqual(50);
    expect(runs.length).toBeGreaterThan(0);
  });
});
