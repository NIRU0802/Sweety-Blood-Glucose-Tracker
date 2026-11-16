# Sweety – Blood Glucose Tracker

A web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and monthly reports.

**Stack:** Node.js, Express, PostgreSQL (`pg`), React (Vite), JWT + bcrypt, Jest + Supertest, Docker Compose (database).

## Features
- Sign up / log in (bcrypt-hashed passwords, JWT)
- Add, view, edit, delete readings (4 slots per day)
- Validation with clear error messages
- Daily, month-to-date and previous-month reports (highest, lowest, average, count, empty state)
- Pagination on `GET /api/readings?page=1&limit=20`

## Prerequisites
Node.js 18+ (20 LTS recommended), npm, and either Docker Desktop or a local PostgreSQL 14+.

## Setup

```bash
git clone https://github.com/NIRU0802/Sweety-Blood-Glucose-Tracker.git
cd Sweety-Blood-Glucose-Tracker
```

### 1. Database
Docker:
```bash
docker compose up -d
docker compose exec db createdb -U postgres sweety_test
```
Local PostgreSQL: create databases `sweety` and `sweety_test`, then put your credentials in `server/.env`.

### 2. Server
```bash
cd server
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
npm install
npm run migrate           # creates tables
npm run seed              # demo user + sample readings
npm run dev               # http://localhost:5000
```
Set `JWT_SECRET` in `.env` to a long random string.

### 3. Client
```bash
cd client
npm install
npm run dev               # http://localhost:5173
```

### 4. Tests
```bash
cd server
npm test
```
Tests use the `TEST_DATABASE_URL` database and truncate its tables.

## Demo login
`demo@sweety.test` / `Demo@123`

## Environment variables (`server/.env.example`)
| Variable | Purpose |
|---|---|
| PORT | API port (5000) |
| DATABASE_URL | Main database |
| TEST_DATABASE_URL | Database used by tests |
| JWT_SECRET | Secret for signing tokens |
| JWT_EXPIRES_IN | Token lifetime (7d) |
| APP_TIMEZONE | Timezone for the "future date" check (Asia/Kolkata) |

## API
| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/register | Sign up |
| POST | /api/auth/login | Log in, returns JWT |
| GET | /api/readings | List own readings (`date`, `page`, `limit`) |
| POST | /api/readings | Add reading |
| PUT | /api/readings/:id | Edit reading |
| DELETE | /api/readings/:id | Delete reading |
| GET | /api/reports/daily?date= | Daily report |
| GET | /api/reports/month-to-date?date= | Month-to-date report |
| GET | /api/reports/monthly?date= | Previous month report |

## Notes

### Assumptions
- Dates are plain `YYYY-MM-DD` strings. The client sends the user's local date and the server checks "future" using `APP_TIMEZONE` (default Asia/Kolkata).
- With 4 slots and one reading per slot per day, the "max 4 per day" rule can never trigger before the duplicate-slot rule. Both are implemented, and the database has `UNIQUE (user_id, reading_date, slot)` as a safety net.
- "Monthly" means the whole previous month relative to the selected date (January goes to December of the previous year).
- Average is rounded to 1 decimal; empty periods return nulls and the UI shows an empty state.
- JWT is stored in `localStorage` for simplicity. Password minimum is 6 characters.
- `npm audit` warnings come from dev dependencies and old transitive packages; I did not force-upgrade them.

### What I'd improve with more time
- HttpOnly cookies, refresh tokens, login rate limiting
- Frontend tests (React Testing Library) and more edge-case API tests
- Line chart of readings (Recharts) and a pagination UI
- Dockerfiles for the app, CI pipeline
- Doctor role, Redis caching, BullMQ reminders