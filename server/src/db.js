require('dotenv').config();
const { Pool, types } = require('pg');

// Return DATE as 'YYYY-MM-DD' string (avoids timezone shifts)
types.setTypeParser(1082, (v) => v);
// NUMERIC (AVG) and BIGINT (COUNT) come back as numbers
types.setTypeParser(1700, (v) => parseFloat(v));
types.setTypeParser(20, (v) => parseInt(v, 10));

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

module.exports = new Pool({ connectionString });