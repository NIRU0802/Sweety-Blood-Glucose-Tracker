const { getRange, isValidDate } = require('../src/utils/dates');

describe('getRange', () => {
  test('daily is the selected date', () => {
    expect(getRange('daily', '2026-10-15')).toEqual({ from: '2026-10-15', to: '2026-10-15' });
  });
  test('month-to-date', () => {
    expect(getRange('month-to-date', '2026-10-15')).toEqual({ from: '2026-10-01', to: '2026-10-15' });
  });
  test('monthly is the whole previous month', () => {
    expect(getRange('monthly', '2026-10-15')).toEqual({ from: '2026-09-01', to: '2026-09-30' });
  });
  test('monthly in January goes to December of previous year', () => {
    expect(getRange('monthly', '2026-01-10')).toEqual({ from: '2025-12-01', to: '2025-12-31' });
  });
  test('monthly handles leap-year February', () => {
    expect(getRange('monthly', '2024-03-05')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
  });
});

describe('isValidDate', () => {
  test.each([['2026-10-15', true], ['2026-02-30', false], ['15-10-2026', false], ['', false]])(
    '%s -> %s', (input, expected) => expect(isValidDate(input)).toBe(expected)
  );
});