import { Pool } from 'pg';

// Using a standard connection pool. 
// In Next.js dev mode this can sometimes spawn multiple pools, but it is fine for early dev.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
