const { isValidDate, todayStr } = require('../utils/dates');

const SLOT_LABELS = {
  MORNING_FASTING: 'Morning (fasting)',
  AFTER_BREAKFAST: 'After breakfast',
  AFTER_LUNCH: 'After lunch',
  AFTER_DINNER: 'After dinner',
};

function parseValue(raw) {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === 'string') {
    if (raw.trim() === '') return null;
    return Number(raw);
  }
  return raw;
}

// Pure field validation. Returns an error message or null.
function validateFields({ value, date, slot }) {
  const v = parseValue(value);
  if (v === null) return 'Please enter a glucose value.';
  if (!Number.isInteger(v) || v < 40 || v > 600) {
    return 'Value must be between 40 and 600 mg/dl.';
  }
  if (!SLOT_LABELS[slot]) return 'Please select a valid time slot.';
  if (!isValidDate(date)) return 'Please select a valid date.';
  if (date > todayStr()) return 'Date cannot be in the future.';
  return null;
}

module.exports = { SLOT_LABELS, parseValue, validateFields };