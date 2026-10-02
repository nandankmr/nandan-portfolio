import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query('BEGIN');
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hermes_topics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        title text NOT NULL,
        url text NOT NULL,
        source text NOT NULL,
        score int NOT NULL DEFAULT 0,
        snippet text NULL,
        status text NOT NULL DEFAULT 'candidate'
          CHECK (status IN ('candidate', 'drafting', 'drafted', 'dismissed')),
        draft_post_id uuid NULL REFERENCES posts(id) ON DELETE SET NULL,
        discovered_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS hermes_topics_url_idx
      ON hermes_topics (lower(url))
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS hermes_topics_status_idx
      ON hermes_topics (status, discovered_at DESC)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hermes_jobs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        type text NOT NULL CHECK (type IN ('discover', 'draft', 'revise')),
        status text NOT NULL DEFAULT 'queued'
          CHECK (status IN ('queued', 'running', 'done', 'error')),
        stage text NULL,
        topic_id uuid NULL REFERENCES hermes_topics(id) ON DELETE SET NULL,
        draft_post_id uuid NULL REFERENCES posts(id) ON DELETE SET NULL,
        error text NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS hermes_jobs_status_idx
      ON hermes_jobs (status, updated_at DESC)
    `);

    await pool.query('COMMIT');
    console.log('hermes migration complete');
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
