# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev        # local dev server (localhost:3000)
npm run build      # production build (always run before deploy)
npm run lint       # ESLint
```

**Deploy to production** — never manually rsync `.next/`:
```bash
bash scripts/deploy.sh
```
This syncs source → server → builds there → verifies `BUILD_ID` exists → restarts PM2 → confirms site responds. `NEXT_PUBLIC_*` vars must be baked in at build time on the server (not locally), because the local `.env.local` sets `NEXT_PUBLIC_APP_ENV=local`.

**Seed blog posts from MDX files into the database** (run on server):
```bash
DATABASE_URL=... npx tsx scripts/seed-blog.ts
```

## Architecture

### Single Next.js app, two public URLs

- `nandankumar.com` → portfolio (single-page, `src/app/page.tsx`)
- `blog.nandankumar.com` → blog (Next.js route `/blog/*`)

Nginx proxies both domains to `localhost:3000` with no path rewriting. `src/proxy.ts` (Next.js 16 Proxy — formerly middleware) intercepts requests with `Host: blog.*` and internally rewrites them to `/blog/*`. The browser URL stays clean.

> **Next.js 16 breaking change**: the intercept file is `proxy.ts`, not `middleware.ts`. The exported function must be named `proxy`. See `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`.

### Theme and accent system

The portfolio has 3 themes (`minimal`, `terminal`, `bold`) and 3 accent colors. Both are stored in React state on `page.tsx` and `BlogChrome.tsx`, applied via `document.body.dataset.theme` and CSS custom property `--accent`. A random theme+accent is picked on each page load. All CSS is in `src/app/globals.css` — no Tailwind utilities in JSX; Tailwind is only used for its reset/base styles.

### Blog data layer

All posts (human-written and Hermes-authored) live in PostgreSQL (`posts` table, server port 5433). There are **no MDX files used at runtime** — the six files in `content/blog/` are source-of-truth for human posts and were seeded via `scripts/seed-blog.ts`. Post content is stored as Markdown strings, rendered at request time via `next-mdx-remote/rsc` + `rehype-pretty-code` (Shiki).

Key files:
- `src/lib/db.ts` — singleton `pg.Pool`, re-used across hot-reloads via `globalThis`
- `src/lib/blog/posts.ts` — all DB queries; returns `BlogPostMeta` or `{ meta, content }`
- `src/lib/blog/types.ts` — `BlogPostMeta` type; `authoredBy: 'human' | 'hermes'`
- `src/lib/blog/urls.ts` — URL helpers; switches between localhost and production origins based on `NEXT_PUBLIC_APP_ENV`
- `src/lib/mdx.ts` — shared `mdxOptions` (remark/rehype plugins)
- `src/lib/mdx-components.tsx` — custom MDX components (e.g. `<Callout>`)

### Blog API (for Hermes agent)

`POST /api/blog/posts` — creates a draft; returns `preview_url` with a secret token
`PATCH /api/blog/posts/[id]` — `{ action: "publish" | "discard" }`; publish triggers `revalidatePath('/blog')`
`POST /api/blog/subscribe` — forwards to Buttondown

All mutation routes require `Authorization: Bearer <BLOG_API_KEY>`.

### Blog pages

All blog pages use `export const dynamic = 'force-dynamic'` — they SSR on every request. This is intentional: the DB is on the same machine as the Next.js server (sub-ms latency), and it allows Hermes-published posts to appear instantly without a redeploy.

### Portfolio content

All portfolio content (experience, projects, skills, personal info) lives in `src/lib/data.ts`. Edit that file to update any section. No DB involved for the portfolio.

### Environment variables

| Variable | Used in |
|---|---|
| `DATABASE_URL` | `src/lib/db.ts` |
| `BLOG_API_KEY` | Blog API Bearer token auth |
| `RESEND_API_KEY` | `src/app/api/contact/route.ts` |
| `FROM_EMAIL` | Contact form sender address |
| `BUTTONDOWN_API_KEY` | Subscribe route (optional; logs if absent) |
| `NEXT_PUBLIC_APP_ENV` | Set to `local` in dev; absent in prod |
| `NEXT_PUBLIC_SITE_ORIGIN` | Absolute URL for portfolio |
| `NEXT_PUBLIC_BLOG_ORIGIN` | Absolute URL for blog |

`NEXT_PUBLIC_*` vars are baked into the client bundle at build time. Always build on the server via `scripts/deploy.sh` so production URLs are embedded, not localhost values.

### Server

OCI instance: `$DEPLOY_HOST`, SSH key at `$OCI_KEY`. Both live in the git-ignored `.env.deploy` (never commit the origin host; the site sits behind Cloudflare).
PM2 process: `portfolio`. PostgreSQL on port `5433` (not the default 5432).
Nginx configs in `/etc/nginx/sites-available/`: `nandankumar.com` and `blog.nandankumar.com`.

### Pre-deploy checklist

Before running `scripts/deploy.sh`:
1. Run `npm run dev` and manually test changed pages at `localhost:3000`
2. Run `npm run build` locally — must complete without TypeScript or lint errors (DB connection errors during static generation are expected and harmless since blog pages are `force-dynamic`)
3. Run `npm run lint` — must pass
