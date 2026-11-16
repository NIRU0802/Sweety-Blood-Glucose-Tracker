// All dates are 'YYYY-MM-DD' strings. We use UTC math only to avoid timezone bugs.

function todayStr() {
    const tz = process.env.APP_TIMEZONE || 'Asia/Kolkata';
    return new Date().toLocaleDateString('en-CA', { timeZone: tz }); // en-CA => YYYY-MM-DD
  }
  
  function isValidDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
    const d = new Date(`${s}T00:00:00Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }
  
  const fmt = (d) => d.toISOString().slice(0, 10);
  
  function getRange(type, dateStr) {
    const [y, m] = dateStr.split('-').map(Number);
    if (type === 'daily') return { from: dateStr, to: dateStr };
    if (type === 'month-to-date') {
      return { from: fmt(new Date(Date.UTC(y, m - 1, 1))), to: dateStr };
    }
    if (type === 'monthly') {
      // Whole previous month. Date.UTC handles January -> December of previous year.
      return {
        from: fmt(new Date(Date.UTC(y, m - 2, 1))),
        to: fmt(new Date(Date.UTC(y, m - 1, 0))),
      };
    }
    throw new Error('Unknown report type');
  }
  
  module.exports = { todayStr, isValidDate, getRange };