const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { getRange, isValidDate, todayStr } = require('../utils/dates');

router.use(auth);

const TYPES = ['daily', 'month-to-date', 'monthly'];

// GET /api/reports/:type?date=YYYY-MM-DD
router.get('/:type', async (req, res, next) => {
  try {
    const { type } = req.params;
    if (!TYPES.includes(type)) return res.status(404).json({ error: 'Unknown report type.' });

    const date = req.query.date || todayStr();
    if (!isValidDate(date)) return res.status(400).json({ error: 'Invalid date.' });

    const { from, to } = getRange(type, date);

    const { rows } = await db.query(
      `SELECT MAX(value) AS highest, MIN(value) AS lowest,
              ROUND(AVG(value), 1) AS average, COUNT(*) AS count
       FROM readings
       WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3`,
      [req.user.id, from, to]
    );
    const r = rows[0];

    const report = {
      type,
      range: { from, to },
      count: r.count,
      highest: r.count ? r.highest : null,
      lowest: r.count ? r.lowest : null,
      average: r.count ? r.average : null,
    };

    if (type === 'daily') {
      const list = await db.query(
        'SELECT id, slot, value FROM readings WHERE user_id=$1 AND reading_date=$2 ORDER BY slot',
        [req.user.id, date]
      );
      report.readings = list.rows;
    }
    res.json(report);
  } catch (e) { next(e); }
});

module.exports = router;