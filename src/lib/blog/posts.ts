// Data layer — reads from PostgreSQL.
// Hermes-authored posts and human-authored posts both live here.
// Human authors can seed posts via the API or the seed script.

import pool from '@/lib/db';
import type { BlogPostMeta } from './types';

// ── DB row → BlogPostMeta ────────────────────────────────────────────

function rowToMeta(row: Record<string, unknown>): BlogPostMeta {
  return {
    id: row.id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: row.description as string,
    dek: (row.dek as string) ?? '',
    category: row.category as BlogPostMeta['category'],
    publishedAt: (row.date as Date).toISOString().split('T')[0],
    updatedAt: row.updated_at
      ? (row.updated_at as Date).toISOString().split('T')[0]
      : undefined,
    readTime: (row.reading_time as string) ?? '5 min',
    featured: (row.featured as boolean) ?? false,
    draft: false,
    authoredBy: (row.authored_by as string) as 'human' | 'hermes',
    commentsEnabled: (row.comments_enabled as boolean | undefined) ?? true,
    tags: (row.tags as string[]) ?? [],
    toc: (row.toc as BlogPostMeta['toc']) ?? [],
  };
}

// ── Queries ──────────────────────────────────────────────────────────

export async function getAllPosts(): Promise<BlogPostMeta[]> {
  const { rows } = await pool.query(
    `SELECT * FROM posts WHERE status = 'published' ORDER BY date DESC`
  );
  return rows.map(rowToMeta);
}

export async function getPublishedPosts(): Promise<BlogPostMeta[]> {
  return getAllPosts();
}

export async function getPostBySlug(
  slug: string
): Promise<{ meta: BlogPostMeta; content: string } | null> {
  const { rows } = await pool.query(
    `SELECT * FROM posts WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  if (!rows[0]) return null;
  return { meta: rowToMeta(rows[0]), content: rows[0].content as string };
}

export async function getFeaturedPost(): Promise<BlogPostMeta | null> {
  const { rows } = await pool.query(
    `SELECT * FROM posts WHERE status = 'published' ORDER BY featured DESC, date DESC LIMIT 1`
  );
  return rows[0] ? rowToMeta(rows[0]) : null;
}

export async function getAdjacentPosts(
  slug: string
): Promise<{ previous: BlogPostMeta | null; next: BlogPostMeta | null }> {
  // Get current post date
  const { rows: current } = await pool.query(
    `SELECT date FROM posts WHERE slug = $1 AND status = 'published'`,
    [slug]
  );
  if (!current[0]) return { previous: null, next: null };
  const date = current[0].date as Date;

  const [prevRes, nextRes] = await Promise.all([
    pool.query(
      `SELECT * FROM posts WHERE status = 'published' AND date < $1 ORDER BY date DESC LIMIT 1`,
      [date]
    ),
    pool.query(
      `SELECT * FROM posts WHERE status = 'published' AND date > $1 ORDER BY date ASC LIMIT 1`,
      [date]
    ),
  ]);

  return {
    previous: prevRes.rows[0] ? rowToMeta(prevRes.rows[0]) : null,
    next: nextRes.rows[0] ? rowToMeta(nextRes.rows[0]) : null,
  };
}

export async function getCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  return ['All', ...Array.from(new Set(posts.map((p) => p.category)))];
}

export async function getPostByPreviewToken(
  id: string,
  token: string
): Promise<{ meta: BlogPostMeta; content: string } | null> {
  const { rows } = await pool.query(
    `SELECT * FROM posts WHERE id = $1 AND preview_token = $2 AND status = 'draft'`,
    [id, token]
  );
  if (!rows[0]) return null;
  const meta = rowToMeta({ ...rows[0], status: 'draft', draft: true });
  return { meta: { ...meta, draft: true }, content: rows[0].content as string };
}
