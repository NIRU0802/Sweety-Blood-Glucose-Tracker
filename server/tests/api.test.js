process.env.JWT_SECRET = 'test_secret';
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/db');
const migrate = require('../src/migrate');

let token, token2;

async function register(email) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test', email, password: 'secret123' });
  return res.body.token;
}
const post = (body, t = token) =>
  request(app).post('/api/readings').set('Authorization', `Bearer ${t}`).send(body);

beforeAll(async () => { await migrate(); });
beforeEach(async () => {
  await db.query('TRUNCATE readings, users RESTART IDENTITY CASCADE');
  token = await register('a@test.com');
  token2 = await register('b@test.com');
});
afterAll(async () => { await db.end(); });

describe('auth', () => {
  test('password is hashed and never returned', async () => {
    const { rows } = await db.query("SELECT password_hash FROM users WHERE email='a@test.com'");
    expect(rows[0].password_hash).not.toBe('secret123');
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'secret123' });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
  test('wrong password is rejected', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'a@test.com', password: 'nope' });
    expect(res.status).toBe(401);
  });
  test('readings require a token', async () => {
    expect((await request(app).get('/api/readings')).status).toBe(401);
  });
});

describe('reading validation', () => {
  const base = { date: '2026-10-15', slot: 'AFTER_LUNCH', value: 120 };

  test('valid reading is created', async () => {
    const res = await post(base);
    expect(res.status).toBe(201);
    expect(res.body.value).toBe(120);
  });
  test.each([
    [undefined, 'Please enter a glucose value.'],
    ['', 'Please enter a glucose value.'],
    [39, 'Value must be between 40 and 600 mg/dl.'],
    [601, 'Value must be between 40 and 600 mg/dl.'],
    [120.5, 'Value must be between 40 and 600 mg/dl.'],
  ])('value %p -> %s', async (value, message) => {
    const res = await post({ ...base, value });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(message);
  });
  test('future date is rejected', async () => {
    const res = await post({ ...base, date: '2999-01-01' });
    expect(res.body.error).toBe('Date cannot be in the future.');
  });
  test('duplicate slot on same day is rejected', async () => {
    await post(base);
    const res = await post(base);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('You already have an After lunch reading for this date.');
  });
  test('max 4 readings per day (rule enforced by DB helper too)', async () => {
    for (const slot of ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER']) {
      expect((await post({ ...base, slot })).status).toBe(201);
    }
    const res = await post(base); // 5th attempt hits duplicate rule first
    expect(res.status).toBe(400);
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM readings');
    expect(rows[0].n).toBe(4);
  });
});

describe('ownership and edit/delete', () => {
  test("user B cannot edit or delete user A's reading", async () => {
    const created = await post({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 120 });
    const id = created.body.id;
    const put = await request(app).put(`/api/readings/${id}`).set('Authorization', `Bearer ${token2}`)
      .send({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 200 });
    const del = await request(app).delete(`/api/readings/${id}`).set('Authorization', `Bearer ${token2}`);
    expect(put.status).toBe(404);
    expect(del.status).toBe(404);
  });
  test('user can edit own reading without a false duplicate error', async () => {
    const created = await post({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 120 });
    const res = await request(app).put(`/api/readings/${created.body.id}`).set('Authorization', `Bearer ${token}`)
      .send({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 130 });
    expect(res.status).toBe(200);
    expect(res.body.value).toBe(130);
  });
  test('user only sees own readings', async () => {
    await post({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 120 });
    const res = await request(app).get('/api/readings').set('Authorization', `Bearer ${token2}`);
    expect(res.body.total).toBe(0);
  });
});

describe('reports', () => {
  const get = (type, date) =>
    request(app).get(`/api/reports/${type}?date=${date}`).set('Authorization', `Bearer ${token}`);

  beforeEach(async () => {
    await post({ date: '2026-10-15', slot: 'MORNING_FASTING', value: 100 });
    await post({ date: '2026-10-15', slot: 'AFTER_LUNCH', value: 150 });
    await post({ date: '2026-10-01', slot: 'AFTER_LUNCH', value: 90 });
    await post({ date: '2026-09-30', slot: 'AFTER_LUNCH', value: 200 });
  });

  test('daily report math', async () => {
    const { body } = await get('daily', '2026-10-15');
    expect(body).toMatchObject({ highest: 150, lowest: 100, average: 125, count: 2 });
    expect(body.readings).toHaveLength(2);
  });
  test('month-to-date report', async () => {
    const { body } = await get('month-to-date', '2026-10-15');
    expect(body).toMatchObject({ highest: 150, lowest: 90, average: 113.3, count: 3 });
  });
  test('monthly report uses previous month', async () => {
    const { body } = await get('monthly', '2026-10-15');
    expect(body).toMatchObject({ highest: 200, lowest: 200, average: 200, count: 1 });
  });
  test('empty period returns count 0 and nulls', async () => {
    const { body } = await get('daily', '2026-10-10');
    expect(body).toMatchObject({ count: 0, highest: null, lowest: null, average: null });
  });
});