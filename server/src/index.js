require('dotenv').config();
const app = require('./app');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Copy .env.example to .env first.');
  process.exit(1);
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Sweety API running on http://localhost:${port}`));