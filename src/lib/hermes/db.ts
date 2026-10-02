import pool from '@/lib/db';
import type {
  DiscoveredTopic,
  HermesJob,
  HermesTopic,
  JobStatus,
  JobType,
  TopicStatus,
} from './types';

// ── Row mappers ───────────────────────────────────────────────────────

function toTopic(row: Record<string, unknown>): HermesTopic {
  return {
    id: row.id as string,
    title: row.title as string,
    url: row.url as string,
    source: row.source as HermesTopic['source'],
    score: row.score as number,
    snippet: (row.snippet as string | null) ?? null,
    status: row.status as TopicStatus,
    draftPostId: (row.draft_post_id as string | null) ?? null,
    discoveredAt: (row.discovered_at as Date).toISOString(),
  };
}

function toJob(row: Record<string, unknown>): HermesJob {
  return {
    id: row.id as string,
    type: row.type as JobType,
    status: row.status as JobStatus,
    stage: (row.stage as string | null) ?? null,
    topicId: (row.topic_id as string | null) ?? null,
    draftPostId: (row.draft_post_id as string | null) ?? null,
    error: (row.error as string | null) ?? null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };
}

// ── Topics ────────────────────────────────────────────────────────────

/**
 * Insert freshly discovered topics, skipping any whose URL already exists
 * (dedup by lower(url)) or whose URL already produced a published post.
 * Returns the number of new candidates inserted.
 */
export async function upsertDiscoveredTopics(topics: DiscoveredTopic[]): Promise<number> {
  if (!topics.length) return 0;
  let inserted = 0;
  for (const t of topics) {
    const { rowCount } = await pool.query(
      `INSERT INTO hermes_topics (title, url, source, score, snippet)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (lower(url)) DO NOTHING`,
      [t.title, t.url, t.source, t.score, t.snippet ?? null]
    );
    inserted += rowCount ?? 0;
  }
  return inserted;
}

export async function listTopics(
  status: TopicStatus | 'all' = 'candidate',
  limit = 50
): Promise<HermesTopic[]> {
  const params: unknown[] = [];
  let where = '';
  if (status !== 'all') {
    params.push(status);
    where = `WHERE status = $${params.length}`;
  }
  params.push(limit);
  const { rows } = await pool.query(
    `SELECT * FROM hermes_topics ${where}
     ORDER BY discovered_at DESC, score DESC
     LIMIT $${params.length}`,
    params
  );
  return rows.map(toTopic);
}

export async function getTopic(id: string): Promise<HermesTopic | null> {
  const { rows } = await pool.query(`SELECT * FROM hermes_topics WHERE id = $1`, [id]);
  return rows[0] ? toTopic(rows[0]) : null;
}

export async function setTopicStatus(
  id: string,
  status: TopicStatus,
  draftPostId?: string | null
): Promise<HermesTopic | null> {
  const { rows } = await pool.query(
    `UPDATE hermes_topics
     SET status = $2,
         draft_post_id = COALESCE($3, draft_post_id)
     WHERE id = $1
     RETURNING *`,
    [id, status, draftPostId ?? null]
  );
  return rows[0] ? toTopic(rows[0]) : null;
}

// ── Jobs ──────────────────────────────────────────────────────────────

export async function createJob(
  type: JobType,
  opts: { topicId?: string | null; draftPostId?: string | null } = {}
): Promise<HermesJob> {
  const { rows } = await pool.query(
    `INSERT INTO hermes_jobs (type, status, topic_id, draft_post_id)
     VALUES ($1, 'queued', $2, $3)
     RETURNING *`,
    [type, opts.topicId ?? null, opts.draftPostId ?? null]
  );
  return toJob(rows[0]);
}

export async function updateJob(
  id: string,
  fields: Partial<{
    status: JobStatus;
    stage: string | null;
    draftPostId: string | null;
    error: string | null;
  }>
): Promise<HermesJob | null> {
  const cols: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  const push = (col: string, val: unknown) => {
    cols.push(`${col} = $${i++}`);
    vals.push(val);
  };
  if (fields.status !== undefined) push('status', fields.status);
  if (fields.stage !== undefined) push('stage', fields.stage);
  if (fields.draftPostId !== undefined) push('draft_post_id', fields.draftPostId);
  if (fields.error !== undefined) push('error', fields.error);
  if (cols.length === 0) return getJob(id);
  cols.push(`updated_at = now()`);
  vals.push(id);
  const { rows } = await pool.query(
    `UPDATE hermes_jobs SET ${cols.join(', ')} WHERE id = $${i} RETURNING *`,
    vals
  );
  return rows[0] ? toJob(rows[0]) : null;
}

export async function getJob(id: string): Promise<HermesJob | null> {
  const { rows } = await pool.query(`SELECT * FROM hermes_jobs WHERE id = $1`, [id]);
  return rows[0] ? toJob(rows[0]) : null;
}

export async function listActiveJobs(): Promise<HermesJob[]> {
  const { rows } = await pool.query(
    `SELECT * FROM hermes_jobs
     WHERE status IN ('queued', 'running')
     ORDER BY created_at DESC`
  );
  return rows.map(toJob);
}

/**
 * Mark long-stuck jobs as errored. Guards against a process restart that
 * orphaned an in-flight job (the background promise died with the process).
 */
export async function reapStaleJobs(olderThanMinutes = 10): Promise<number> {
  const { rowCount } = await pool.query(
    `UPDATE hermes_jobs
     SET status = 'error',
         error = 'Job timed out or was interrupted',
         updated_at = now()
     WHERE status IN ('queued', 'running')
       AND updated_at < now() - ($1 || ' minutes')::interval`,
    [String(olderThanMinutes)]
  );
  return rowCount ?? 0;
}
