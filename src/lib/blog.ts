import pool from './db';
import crypto from 'crypto';

export type PostStatus = 'draft' | 'published' | 'discarded';
export type AuthoredBy = 'human' | 'hermes';

export interface TocEntry {
  id: string;
  label: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  dek: string | null;
  category: string;
  tags: string[];
  date: string;         // ISO date string
  reading_time: string | null;
  toc: TocEntry[];
  content: string;
  status: PostStatus;
  authored_by: AuthoredBy;
  featured: boolean;
  preview_token: string | null;
  created_at: string;
  updated_at: string;
}

// ── Queries ──────────────────────────────────────────────────────────

export async function getPublishedPosts(): Promise<Post[]> {
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE status = 'published' ORDER BY date DESC`
  );
  return rows;
}

export async function getDraftPosts(): Promise<Post[]> {
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE status = 'draft' ORDER BY created_at DESC`
  );
  return rows;
}

export async function getPublishedPost(slug: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  return rows[0] ?? null;
}

export async function getAdjacentPosts(
  date: string
): Promise<{ prev: Post | null; next: Post | null }> {
  const [prevRes, nextRes] = await Promise.all([
    pool.query<Post>(
      `SELECT * FROM posts WHERE status = 'published' AND date < $1 ORDER BY date DESC LIMIT 1`,
      [date]
    ),
    pool.query<Post>(
      `SELECT * FROM posts WHERE status = 'published' AND date > $1 ORDER BY date ASC LIMIT 1`,
      [date]
    ),
  ]);
  return { prev: prevRes.rows[0] ?? null, next: nextRes.rows[0] ?? null };
}

export async function getPostById(id: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getPostByPreviewToken(
  id: string,
  token: string
): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `SELECT * FROM posts WHERE id = $1 AND preview_token = $2`,
    [id, token]
  );
  return rows[0] ?? null;
}

export interface CreatePostInput {
  slug: string;
  title: string;
  description: string;
  dek?: string;
  category: string;
  tags?: string[];
  date: string;
  reading_time?: string;
  toc?: TocEntry[];
  content: string;
  authored_by?: AuthoredBy;
  featured?: boolean;
}

export async function createPost(input: CreatePostInput): Promise<Post> {
  const token = crypto.randomBytes(24).toString('hex');
  const { rows } = await pool.query<Post>(
    `INSERT INTO posts
       (slug, title, description, dek, category, tags, date,
        reading_time, toc, content, status, authored_by, featured, preview_token)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11,$12,$13)
     RETURNING *`,
    [
      input.slug,
      input.title,
      input.description,
      input.dek ?? null,
      input.category,
      input.tags ?? [],
      input.date,
      input.reading_time ?? null,
      JSON.stringify(input.toc ?? []),
      input.content,
      input.authored_by ?? 'human',
      input.featured ?? false,
      token,
    ]
  );
  return rows[0];
}

export interface UpdatePostInput {
  title?: string;
  description?: string;
  dek?: string;
  category?: string;
  tags?: string[];
  reading_time?: string;
  toc?: TocEntry[];
  content?: string;
}

export async function updateDraftPost(
  id: string,
  fields: UpdatePostInput
): Promise<Post | null> {
  // Build a dynamic SET clause from provided fields only
  const cols: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  const push = (col: string, val: unknown) => {
    cols.push(`${col} = $${i++}`);
    vals.push(val);
  };

  if (fields.title !== undefined) push('title', fields.title);
  if (fields.description !== undefined) push('description', fields.description);
  if (fields.dek !== undefined) push('dek', fields.dek);
  if (fields.category !== undefined) push('category', fields.category);
  if (fields.tags !== undefined) push('tags', fields.tags);
  if (fields.reading_time !== undefined) push('reading_time', fields.reading_time);
  if (fields.toc !== undefined) push('toc', JSON.stringify(fields.toc));
  if (fields.content !== undefined) push('content', fields.content);

  if (cols.length === 0) return getPostById(id);

  cols.push(`updated_at = NOW()`);
  vals.push(id);

  const { rows } = await pool.query<Post>(
    `UPDATE posts SET ${cols.join(', ')}
     WHERE id = $${i} AND status = 'draft' RETURNING *`,
    vals
  );
  return rows[0] ?? null;
}

export async function publishPost(id: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `UPDATE posts SET status = 'published', updated_at = NOW()
     WHERE id = $1 AND status = 'draft' RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

export async function discardPost(id: string): Promise<Post | null> {
  const { rows } = await pool.query<Post>(
    `UPDATE posts SET status = 'discarded', updated_at = NOW()
     WHERE id = $1 AND status = 'draft' RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}

// ── Reading time ──────────────────────────────────────────────────────
export function calcReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min`;
}
