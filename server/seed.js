require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./src/db');
const migrate = require('./src/migrate');
const { todayStr } = require('./src/utils/dates');

const SLOTS = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];
const BASE = { MORNING_FASTING: 100, AFTER_BREAKFAST: 150, AFTER_LUNCH: 140, AFTER_DINNER: 145 };

(async () => {
  await migrate();
  const hash = await bcrypt.hash('Demo@123', 10);
  const { rows } = await db.query(
    `INSERT INTO users (name, email, password_hash) VALUES ('Demo User', 'demo@sweety.test', $1)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id`,
    [hash]
  );
  const userId = rows[0].id;

  const today = new Date(`${todayStr()}T00:00:00Z`);
  let inserted = 0;
  for (let i = 0; i < 70; i++) {          // ~70 days so the "previous month" report has data
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    for (const slot of SLOTS) {
      if (Math.random() < 0.2) continue;  // skip some slots to look realistic
      const value = BASE[slot] + Math.floor(Math.random() * 60) - 20;
      const r = await db.query(
        `INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1,$2,$3,$4)
         ON CONFLICT DO NOTHING`,
        [userId, date, slot, value]
      );
      inserted += r.rowCount;
    }
  }
  console.log(`Seeded demo user (demo@sweety.test / Demo@123) with ${inserted} readings.`);
  await db.end();
})().catch((e) => { console.error(e); process.exit(1); });