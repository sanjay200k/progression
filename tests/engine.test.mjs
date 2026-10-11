import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays, dateRange, rankForLevel, canAddRestDay, freezeAllowance,
  freezeDatesForHistory, isPerfect, comebackCount, timeMetrics, average
} from '../www/js/engine.js';

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('dateRange is inclusive and ordered', () => {
  assert.deepEqual(dateRange('2026-10-01', '2026-10-03'), ['2026-10-01', '2026-10-02', '2026-10-03']);
  assert.deepEqual(dateRange('2026-10-03', '2026-10-01'), []);
});

test('rankForLevel thresholds', () => {
  const cases = [[1,'E'],[2,'E'],[3,'D'],[6,'D'],[7,'C'],[11,'C'],[12,'B'],[19,'B'],[20,'A'],[29,'A'],[30,'S'],[99,'S']];
  for (const [level, rank] of cases) assert.equal(rankForLevel(level), rank, `level ${level}`);
});

test('canAddRestDay blocks another rest day within 6 days either side', () => {
  assert.equal(canAddRestDay({}, '2026-10-10'), true);
  assert.equal(canAddRestDay({ '2026-10-04': true }, '2026-10-10'), false);
  assert.equal(canAddRestDay({ '2026-10-16': true }, '2026-10-10'), false);
  assert.equal(canAddRestDay({ '2026-10-03': true }, '2026-10-10'), true);
  assert.equal(canAddRestDay({ '2026-10-17': true }, '2026-10-10'), true);
  assert.equal(canAddRestDay({ '2026-10-10': true }, '2026-10-10'), true, 'same day does not block itself');
});

test('freezeAllowance: one freeze per 14 best-streak days', () => {
  assert.equal(freezeAllowance(0), 0);
  assert.equal(freezeAllowance(13), 0);
  assert.equal(freezeAllowance(14), 1);
  assert.equal(freezeAllowance(29), 2);
  assert.equal(freezeAllowance(-5), 0);
});

test('freezeDatesForHistory bridges a single-day gap only when earned', () => {
  const active = ['2026-10-01', '2026-10-02', '2026-10-04', '2026-10-05'];
  assert.deepEqual(freezeDatesForHistory(active, {}, '2026-10-10', 0), {});
  assert.deepEqual(freezeDatesForHistory(active, {}, '2026-10-10', 14), { '2026-10-03': true });
});

test('freezeDatesForHistory never spends more than earned and skips rest days', () => {
  const active = ['2026-10-01', '2026-10-03', '2026-10-05'];
  const frozen = freezeDatesForHistory(active, {}, '2026-10-10', 14);
  assert.equal(Object.keys(frozen).length, 1);
  const withRest = freezeDatesForHistory(active, { '2026-10-02': true }, '2026-10-10', 14);
  assert.equal(withRest['2026-10-02'], undefined);
});

test('freezeDatesForHistory returns empty with no activity', () => {
  assert.deepEqual(freezeDatesForHistory([], {}, '2026-10-10', 28), {});
});

test('isPerfect: rest and empty days are never perfect', () => {
  assert.equal(isPerfect('d', { scheduledCount: 3, completedCount: 3, rest: false }), true);
  assert.equal(isPerfect('d', { scheduledCount: 3, completedCount: 2, rest: false }), false);
  assert.equal(isPerfect('d', { scheduledCount: 0, completedCount: 0, rest: false }), false);
  assert.equal(isPerfect('d', { scheduledCount: 3, completedCount: 3, rest: true }), false);
});

test('comebackCount: first day is not a comeback', () => {
  const sched = new Set(dateRange('2026-10-01', '2026-10-05'));
  assert.equal(comebackCount(['2026-10-01'], sched), 0);
  assert.equal(comebackCount([], sched), 0);
});

test('comebackCount: counts return after a real missed scheduled day', () => {
  const sched = new Set(dateRange('2026-10-01', '2026-10-06'));
  assert.equal(comebackCount(['2026-10-01', '2026-10-02', '2026-10-05'], sched), 1);
});

test('comebackCount: rest days and freezes are not misses', () => {
  const sched = new Set(dateRange('2026-10-01', '2026-10-06'));
  const done = ['2026-10-01', '2026-10-04'];
  assert.equal(comebackCount(done, sched, { '2026-10-02': true, '2026-10-03': true }), 0);
  assert.equal(comebackCount(done, sched, {}, { '2026-10-02': true, '2026-10-03': true }), 0);
  assert.equal(comebackCount(done, sched), 1);
});

test('timeMetrics counts early-bird and late-night by local hour', () => {
  const at = (h) => new Date(2026, 9, 10, h, 30).toISOString();
  const logs = [
    { missionId: 'a', at: at(6) },
    { missionId: 'a', at: at(7) },
    { missionId: 'a', at: at(12) },
    { missionId: 'a', at: at(22) },
    { missionId: 'a', at: at(23) },
    { missionId: 'gone', at: at(5) },
    { missionId: 'a' }
  ];
  const result = timeMetrics(logs, id => id === 'a');
  assert.deepEqual(result, { earlyBird: 2, lateNight: 2 });
});

test('average handles empty and normal input', () => {
  assert.equal(average([]), 0);
  assert.equal(average([2, 4, 6]), 4);
});
