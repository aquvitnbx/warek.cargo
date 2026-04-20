const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
console.log("DB_URL:", process.env.DATABASE_URL);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1')
  .then(res => { console.log("SUCCESS:", res.rows); process.exit(0); })
  .catch(err => { console.log("FAILED:", err.message); process.exit(1); });
