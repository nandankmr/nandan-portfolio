import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await pool.query('BEGIN');
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    await pool.query(`
      ALTER TABLE posts
        ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        parent_id uuid NULL REFERENCES comments(id) ON DELETE CASCADE,
        author_name text NOT NULL CHECK (char_length(author_name) BETWEEN 1 AND 60),
        author_email text NULL,
        body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 3000),
        is_author boolean NOT NULL DEFAULT false,
        status text NOT NULL DEFAULT 'visible' CHECK (status IN ('visible', 'deleted')),
        ip text NOT NULL,
        user_agent text NOT NULL,
        tg_message_id bigint NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS comments_post_status_created_idx
      ON comments (post_id, status, created_at)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS comments_parent_idx
      ON comments (parent_id)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_ip_blocks (
        ip text PRIMARY KEY,
        reason text NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await pool.query('COMMIT');
    console.log('comments migration complete');
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
