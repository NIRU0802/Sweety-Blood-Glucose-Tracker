const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');
const { SLOT_LABELS, parseValue, validateFields } = require('../validators/reading');
const { isValidDate } = require('../utils/dates');

router.use(auth);

const COLS = 'id, reading_date AS date, slot, value';

function duplicateMessage(slot) {
  const label = SLOT_LABELS[slot];
  const article = /^[aeiou]/i.test(label) ? 'an' : 'a';
  return `You already have ${article} ${label} reading for this date.`;
}

// Database-dependent rules (duplicate slot, max 4 per day).
async function checkBusinessRules(userId, { date, slot }, excludeId = 0) {
  const dup = await db.query(
    'SELECT 1 FROM readings WHERE user_id=$1 AND reading_date=$2 AND slot=$3 AND id<>$4',
    [userId, date, slot, excludeId]
  );
  if (dup.rowCount) return duplicateMessage(slot);

  const cnt = await db.query(
    'SELECT COUNT(*) AS n FROM readings WHERE user_id=$1 AND reading_date=$2 AND id<>$3',
    [userId, date, excludeId]
  );
  if (cnt.rows[0].n >= 4) return 'You can add only 4 readings per day.';
  return null;
}

// GET /api/readings?date=YYYY-MM-DD | ?from=YYYY-MM-DD&to=YYYY-MM-DD  &page=1&limit=20
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    // Cap raised to 500 so the chart can load a whole month at once
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 500);
    const params = [req.user.id];
    let where = 'user_id = $1';

    if (req.query.date) {
      if (!isValidDate(req.query.date)) return res.status(400).json({ error: 'Invalid date.' });
      params.push(req.query.date);
      where += ` AND reading_date = $${params.length}`;
    }

    // Range filter used by the chart
    if (req.query.from || req.query.to) {
      const { from, to } = req.query;
      if (!isValidDate(from) || !isValidDate(to)) {
        return res.status(400).json({ error: 'Invalid date range.' });
      }
      params.push(from, to);
      // $n placeholders keep the query parameterized (no string-built SQL)
      where += ` AND reading_date BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    const total = (await db.query(`SELECT COUNT(*) AS n FROM readings WHERE ${where}`, params)).rows[0].n;
    const n = params.length;
    const { rows } = await db.query(
      `SELECT ${COLS} FROM readings WHERE ${where}
       ORDER BY reading_date DESC, slot LIMIT $${n + 1} OFFSET $${n + 2}`,
      [...params, limit, (page - 1) * limit]
    );
    res.json({ data: rows, page, limit, total });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const err = validateFields(req.body);
    if (err) return res.status(400).json({ error: err });

    const { date, slot } = req.body;
    const value = parseValue(req.body.value);

    const ruleErr = await checkBusinessRules(req.user.id, { date, slot });
    if (ruleErr) return res.status(400).json({ error: ruleErr });

    try {
      const { rows } = await db.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4) RETURNING ${COLS}`,
        [req.user.id, date, slot, value]
      );
      res.status(201).json(rows[0]);
    } catch (e) {
      // Safety net for race conditions: UNIQUE constraint violation
      if (e.code === '23505') return res.status(400).json({ error: duplicateMessage(slot) });
      throw e;
    }
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid reading id.' });

    const existing = await db.query('SELECT id FROM readings WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!existing.rowCount) return res.status(404).json({ error: 'Reading not found.' });

    const err = validateFields(req.body);
    if (err) return res.status(400).json({ error: err });

    const { date, slot } = req.body;
    const value = parseValue(req.body.value);

    const ruleErr = await checkBusinessRules(req.user.id, { date, slot }, id);
    if (ruleErr) return res.status(400).json({ error: ruleErr });

    const { rows } = await db.query(
      `UPDATE readings SET reading_date=$1, slot=$2, value=$3
       WHERE id=$4 AND user_id=$5 RETURNING ${COLS}`,
      [date, slot, value, id, req.user.id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id) return res.status(400).json({ error: 'Invalid reading id.' });
    const { rowCount } = await db.query('DELETE FROM readings WHERE id=$1 AND user_id=$2', [id, req.user.id]);
    if (!rowCount) return res.status(404).json({ error: 'Reading not found.' });
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;