import pool from '@/lib/db';
import type { CommentRow, CommentStatus, PublicComment } from './types';

export interface CreateCommentInput {
  postId: string;
  parentId?: string | null;
  authorName: string;
  authorEmail?: string | null;
  body: string;
  isAuthor?: boolean;
  ip: string;
  userAgent: string;
}

export async function getPostForComments(slug: string) {
  const { rows } = await pool.query<{
    id: string;
    slug: string;
    title: string;
    comments_enabled: boolean;
  }>(
    `SELECT id, slug, title, comments_enabled
     FROM posts
     WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  return rows[0] ?? null;
}

function toPublic(row: CommentRow): PublicComment {
  return {
    id: row.id,
    parentId: row.parent_id,
    authorName: row.author_name,
    body: row.body,
    isAuthor: row.is_author,
    createdAt: row.created_at.toISOString(),
    replies: [],
  };
}

export async function getPublicComments(slug: string, limit = 20, offset = 0) {
  const post = await getPostForComments(slug);
  if (!post) return { post: null, comments: [], total: 0 };

  const { rows: parentRows } = await pool.query<CommentRow>(
    `SELECT *
     FROM comments
     WHERE post_id = $1 AND parent_id IS NULL AND status = 'visible'
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [post.id, limit, offset]
  );

  const { rows: countRows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM comments
     WHERE post_id = $1 AND parent_id IS NULL AND status = 'visible'`,
    [post.id]
  );

  if (!parentRows.length) return { post, comments: [], total: Number(countRows[0]?.count ?? 0) };

  const parentIds = parentRows.map((row) => row.id);
  const { rows: replyRows } = await pool.query<CommentRow>(
    `SELECT *
     FROM comments
     WHERE parent_id = ANY($1::uuid[]) AND status = 'visible'
     ORDER BY created_at ASC`,
    [parentIds]
  );

  const grouped = new Map<string, PublicComment>();
  const comments = parentRows.map((row) => {
    const comment = toPublic(row);
    grouped.set(comment.id, comment);
    return comment;
  });

  for (const reply of replyRows) {
    const parent = grouped.get(reply.parent_id ?? '');
    if (parent) parent.replies.push(toPublic(reply));
  }

  return { post, comments, total: Number(countRows[0]?.count ?? 0) };
}

export async function resolveCommentParentId(postId: string, parentId?: string | null) {
  if (!parentId) return null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(parentId)) {
    return undefined;
  }

  const { rows } = await pool.query<{ parent_id: string }>(
    `SELECT COALESCE(parent_id, id)::text AS parent_id
     FROM comments
     WHERE id = $1 AND post_id = $2
     LIMIT 1`,
    [parentId, postId]
  );
  return rows[0]?.parent_id;
}

export async function createComment(input: CreateCommentInput) {
  const { rows } = await pool.query<CommentRow>(
    `INSERT INTO comments
       (post_id, parent_id, author_name, author_email, body, is_author, ip, user_agent)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING *`,
    [
      input.postId,
      input.parentId ?? null,
      input.authorName,
      input.authorEmail ?? null,
      input.body,
      input.isAuthor ?? false,
      input.ip,
      input.userAgent,
    ]
  );
  return rows[0];
}

export async function updateCommentStatus(id: string, status: CommentStatus) {
  const { rows } = await pool.query<CommentRow>(
    `UPDATE comments SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return rows[0] ?? null;
}

export async function setTelegramMessageId(id: string, messageId: number) {
  await pool.query(`UPDATE comments SET tg_message_id = $1 WHERE id = $2`, [messageId, id]);
}

export async function getCommentById(id: string) {
  const { rows } = await pool.query<CommentRow & { post_slug: string; post_title: string }>(
    `SELECT c.*, p.slug AS post_slug, p.title AS post_title
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getCommentByTelegramMessage(messageId: number) {
  const { rows } = await pool.query<CommentRow>(
    `SELECT * FROM comments WHERE tg_message_id = $1 LIMIT 1`,
    [messageId]
  );
  return rows[0] ?? null;
}

export async function getRecentCommentStats(ip: string) {
  const [{ rows: lastRows }, { rows: countRows }, { rows: blockRows }] = await Promise.all([
    pool.query<{ created_at: Date }>(
      `SELECT created_at FROM comments WHERE ip = $1 ORDER BY created_at DESC LIMIT 1`,
      [ip]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM comments
       WHERE ip = $1 AND created_at > now() - interval '10 minutes'`,
      [ip]
    ),
    pool.query<{ ip: string }>(`SELECT ip FROM comment_ip_blocks WHERE ip = $1`, [ip]),
  ]);

  return {
    lastAt: lastRows[0]?.created_at ?? null,
    count10m: Number(countRows[0]?.count ?? 0),
    blocked: Boolean(blockRows[0]),
  };
}

export async function listAdminComments(filters: { post?: string; status?: CommentStatus | 'all'; limit?: number }) {
  const values: unknown[] = [];
  const where: string[] = [];

  if (filters.post) {
    values.push(filters.post);
    where.push(`p.slug = $${values.length}`);
  }
  if (filters.status && filters.status !== 'all') {
    values.push(filters.status);
    where.push(`c.status = $${values.length}`);
  }

  values.push(filters.limit ?? 100);
  const limitParam = `$${values.length}`;

  const { rows } = await pool.query<CommentRow & { post_slug: string; post_title: string }>(
    `SELECT c.*, p.slug AS post_slug, p.title AS post_title
     FROM comments c
     JOIN posts p ON p.id = c.post_id
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY c.created_at DESC
     LIMIT ${limitParam}`,
    values
  );
  return rows;
}

export async function listCommentPosts() {
  const { rows } = await pool.query<{ id: string; slug: string; title: string; comments_enabled: boolean }>(
    `SELECT id, slug, title, comments_enabled
     FROM posts
     WHERE status = 'published'
     ORDER BY date DESC`
  );
  return rows;
}

export async function setPostCommentsEnabled(id: string, enabled: boolean) {
  const { rows } = await pool.query<{ id: string; comments_enabled: boolean }>(
    `UPDATE posts SET comments_enabled = $1 WHERE id = $2 RETURNING id, comments_enabled`,
    [enabled, id]
  );
  return rows[0] ?? null;
}

export async function listIpBlocks() {
  const { rows } = await pool.query<{ ip: string; reason: string | null; created_at: Date }>(
    `SELECT * FROM comment_ip_blocks ORDER BY created_at DESC`
  );
  return rows;
}

export async function addIpBlock(ip: string, reason?: string) {
  const { rows } = await pool.query<{ ip: string; reason: string | null; created_at: Date }>(
    `INSERT INTO comment_ip_blocks (ip, reason)
     VALUES ($1, $2)
     ON CONFLICT (ip) DO UPDATE SET reason = EXCLUDED.reason
     RETURNING *`,
    [ip, reason ?? null]
  );
  return rows[0];
}

export async function removeIpBlock(ip: string) {
  await pool.query(`DELETE FROM comment_ip_blocks WHERE ip = $1`, [ip]);
}
