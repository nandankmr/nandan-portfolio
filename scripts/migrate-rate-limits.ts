import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query('BEGIN');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id bigserial PRIMARY KEY,
        bucket text NOT NULL,
        ip text NOT NULL,
        at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS rate_limits_lookup_idx
      ON rate_limits (bucket, ip, at DESC)
    `);
    await pool.query('COMMIT');
    console.log('rate_limits migration complete');
  } catch (error) {
    await pool.query('ROLLBACK');
    throw error;
  } finally {
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
