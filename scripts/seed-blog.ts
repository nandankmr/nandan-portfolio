// Seed blog posts from content/blog/ into Postgres.
// Run: npx tsx scripts/seed-blog.ts

import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function calcReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function parseMdxFile(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');

  // Extract the export const meta = { ... }; block
  const metaMatch = raw.match(/export\s+const\s+meta\s*=\s*(\{[\s\S]*?\});/);
  if (!metaMatch) throw new Error(`No meta export in ${filePath}`);

  const meta = eval(`(${metaMatch[1]})`);

  // Content = everything after the meta block
  const content = raw.replace(/export\s+const\s+meta\s*=\s*\{[\s\S]*?\};/, '').trim();

  return { meta, content };
}

const POSTS_DIR = path.join(process.cwd(), 'content', 'blog');

async function seed() {
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
  console.log(`Seeding ${files.length} posts…`);

  for (const file of files) {
    const { meta, content } = parseMdxFile(path.join(POSTS_DIR, file));
    const token = crypto.randomBytes(24).toString('hex');
    const status = meta.draft ? 'draft' : 'published';

    await pool.query(
      `INSERT INTO posts
         (slug, title, description, dek, category, tags, date,
          reading_time, toc, content, status, authored_by, featured, preview_token)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'human',$12,$13)
       ON CONFLICT (slug) DO UPDATE SET
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         dek = EXCLUDED.dek,
         category = EXCLUDED.category,
         tags = EXCLUDED.tags,
         date = EXCLUDED.date,
         reading_time = EXCLUDED.reading_time,
         toc = EXCLUDED.toc,
         content = EXCLUDED.content,
         status = EXCLUDED.status,
         featured = EXCLUDED.featured,
         updated_at = NOW()`,
      [
        meta.slug,
        meta.title,
        meta.description,
        meta.dek ?? null,
        meta.category,
        meta.tags ?? [],
        meta.publishedAt,
        meta.readTime ?? calcReadingTime(content),
        JSON.stringify(meta.toc ?? []),
        content,
        status,
        meta.featured ?? false,
        token,
      ]
    );
    console.log(`  ✓ ${meta.slug}`);
  }

  await pool.end();
  console.log('Done.');
}

seed().catch((e) => { console.error(e); process.exit(1); });
