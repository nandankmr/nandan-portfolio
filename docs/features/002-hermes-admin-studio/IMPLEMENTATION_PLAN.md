# Feature 002 — Hermes Studio in the Admin Panel

Status: **Planned** (not started)
Author: Nandan Kumar
Last updated: 2026-05-30

---

## 1. Summary

Bring the full Hermes editorial loop — **daily discovery → research → draft →
preview → revise → publish** — into the web `/admin` panel, reimplemented in
**TypeScript inside the existing Next.js app** (no separate service). Telegram
is retained purely as a **notification channel** (topics ready, draft ready,
published), sent directly from the TS app; its interactive button flow is
superseded by the admin UI.

The Python Hermes (`hermes/`) is the **source of truth to port from** — its
prompt, guardrails, discovery sources, and provider/fallback logic are
re-implemented faithfully in TS, then the Python interactive flow is retired
(notifications move to TS).

---

## 2. Decisions (resolved)

| # | Decision | Choice |
|---|---|---|
| 1 | Where the pipeline runs | **TypeScript, in the Next app.** No Python HTTP service. |
| 2 | Telegram | **Notifications only** (sent from TS). Interactive topic/approve flow retired. |
| 3 | Service topology | **Single service** — everything in the Next app + Postgres. |
| 4 | Scope | **Full loop**: discovery, research, draft, preview, revise, publish — with proper admin UI. |
| 5 | Long-running work | **Background jobs** in-process (route kicks off, returns job id; admin polls). |
| 6 | Draft persistence | Drafts are `posts` rows (status=`draft`), created via the existing data layer directly (no internal HTTP). |
| 7 | Daily discovery trigger | **OS crontab → a secret-guarded Next endpoint** (keeps "one service"). |

---

## 3. What this does NOT do yet

- No separate worker/queue service (jobs run in the Next process).
- No multi-agent visualization, image generation, or eval dashboard (future).
- Does not delete the Python `hermes/` code in v1 — it's left dormant and
  decommissioned only after the TS loop is verified in production.
- No in-admin rich MDX editor for free-form writing (that's feature 001's
  future scope); Studio edits happen via **revise notes**, not a WYSIWYG.

---

## 4. Source-of-truth to port (from `hermes/`)

| Python | Ports to (TS) | Notes |
|---|---|---|
| `discovery.py` | `src/lib/hermes/discovery.ts` | HN top stories + Tavily; technical+craft query pools; HN keyword filter; interleave; dedup. |
| `research.py` | `src/lib/hermes/research.ts` | Fetch source URLs + extract main text. trafilatura → a JS extractor (see §7). |
| `writer.py` | `src/lib/hermes/writer.ts` | **Port verbatim**: SYSTEM_PROMPT, MIN_WORDS, BANNED_PHRASES, bare-anchor + scaffold-heading + component sanitizers, sources append, TOC, read-time, retry chain. |
| `config.py` (providers) | `src/lib/hermes/llm.ts` | OpenAI primary + OpenRouter fallback chain; same model names/retries. |
| `publisher.py` | existing `src/lib/blog.ts` | Use `createPost` / `publishPost` / `discardPost` / `updateDraftPost` directly. |
| `pipeline.py` (orchestration) | `src/lib/hermes/jobs.ts` + API routes | The discover/draft/revise orchestration. |
| `bot.py` interactive flow | **admin UI** | Replaced. |
| Telegram `send_message` | `src/lib/hermes/notify.ts` | Notifications only. |

---

## 5. Architecture

```
                         ┌─────────────────── Next.js app (one service) ───────────────────┐
OS crontab (daily) ──POST /api/admin/hermes/cron?secret=…──► discovery job ─┐               │
                                                                            ▼               │
  /admin/studio (session-gated UI)                                  src/lib/hermes/         │
     │  actions (fetch)                                              ├─ discovery.ts         │
     ├─► POST /api/admin/hermes/discover  ───────────────────────►  ├─ research.ts          │
     ├─► POST /api/admin/hermes/draft     ──(bg job)─────────────►  ├─ writer.ts ─► llm.ts   │
     ├─► POST /api/admin/hermes/revise    ──(bg job)─────────────►  ├─ jobs.ts (runner)      │
     ├─► POST /api/blog/posts/[id] publish/discard (existing)        └─ notify.ts ──► Telegram (notify only)
     └─► polls GET /api/admin/hermes/jobs/[id]                             │
                                                                          ▼
                                          Postgres:  hermes_topics · hermes_jobs · posts(drafts)
                         └──────────────────────────────────────────────────────────────────┘

Telegram (Hermes bot)  ◄── notifications only (no polling, no buttons)
Comments bot (webhook) ── unchanged, unrelated
```

- **Background jobs**: a draft/research run takes ~1 min — too long for a sync
  request (and Cloudflare's ~100s ceiling). The action route inserts a
  `hermes_jobs` row, **starts the async work without `await`** (the PM2/`next
  start` process is long-lived, so the promise keeps running after the response),
  and returns `{ jobId }`. The UI polls job status. Orphaned jobs (process
  restart mid-run) are reaped by a "running > N min ⇒ error" sweep.

---

## 6. Data model (2 new tables; drafts stay in `posts`)

```sql
CREATE TABLE IF NOT EXISTS hermes_topics (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  url           text NOT NULL,
  source        text NOT NULL,            -- 'hn' | 'tavily'
  score         int  NOT NULL DEFAULT 0,
  snippet       text,
  status        text NOT NULL DEFAULT 'candidate', -- candidate|drafting|drafted|dismissed
  draft_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  discovered_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hermes_topics_url_idx ON hermes_topics (lower(url));
CREATE INDEX IF NOT EXISTS hermes_topics_status_idx ON hermes_topics (status, discovered_at DESC);

CREATE TABLE IF NOT EXISTS hermes_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type          text NOT NULL,            -- discover|draft|revise
  status        text NOT NULL DEFAULT 'queued', -- queued|running|done|error
  stage         text,                     -- human label: "Researching…", "Writing…"
  topic_id      uuid REFERENCES hermes_topics(id) ON DELETE SET NULL,
  draft_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hermes_jobs_status_idx ON hermes_jobs (status, updated_at DESC);
```
- Dedup discovery by `lower(url)`; also skip topics whose URL already produced a
  published post.
- `hermes_topics` replaces the ephemeral `state.json` topic list — durable,
  visible in admin, history retained.

---

## 7. New TS modules (`src/lib/hermes/`)

- **`llm.ts`** — `generate(messages)`: try OpenAI (`OPENAI_API_KEY`, `OPENAI_MODEL`)
  first; on failure/429 fall back through the OpenRouter free chain
  (`WRITER_MODEL` + `FALLBACK_MODELS`), `MODEL_RETRIES` each. Raw `fetch` to both
  (OpenRouter is OpenAI-compatible). Mirrors `config.py`.
- **`discovery.ts`** — `discoverTopics()`: HN `topstories` (filtered by the
  keyword set) + Tavily (technical + craft query pools, rotated daily,
  interleaved). Mirrors `discovery.py`. Upserts into `hermes_topics`.
- **`research.ts`** — `researchTopic(topic)`: fetch the source + related URLs and
  extract main text. **Dependency choice:** `@extractus/article-extractor`
  (fetch+extract in one call, maintained) as the trafilatura replacement, with a
  `@mozilla/readability`+`jsdom` fallback. Returns a `ResearchBrief`
  (sources[{title,url,text}], key facts) matching `research.py`'s shape.
- **`writer.ts`** — `writePost(brief)` / `revisePost(current, notes)`. **Port the
  guardrail pipeline verbatim** from `writer.py`: `SYSTEM_PROMPT`, `MIN_WORDS`,
  `BANNED_PHRASES`/`_findBanned`, `_countBareAnchors`, `_stripScaffoldHeadings`,
  `_sanitizeComponents` (allow only `Callout`/`PullQuote`/`Stat`), `_appendSources`,
  TOC extraction, reading-time, and the retry chain (citation → stub-expand →
  de-ban → bare-anchor → sanitize). Output → `DraftPost`.
- **`jobs.ts`** — `runDraftJob(topicId)`, `runReviseJob(draftId, notes)`,
  `runDiscoverJob()`: create/update `hermes_jobs`, drive the stages, write
  results, fire notifications. Includes the stale-job reaper.
- **`notify.ts`** — `notifyHermes(text)`: send a Telegram message via the Hermes
  bot token (notification only, no keyboard). Failure is logged, never blocks.

---

## 8. API surface (all under `/api/admin/hermes`, session-gated)

| Route | Method | Action |
|---|---|---|
| `/discover` | POST | Kick off (or run) discovery; upsert candidates; returns job or topics. |
| `/topics` | GET | List candidates (filter by status/day). |
| `/topics/[id]` | PATCH | `{action:'dismiss'}`. |
| `/draft` | POST | `{topicId}` → background draft job; returns `{jobId}`. |
| `/revise` | POST | `{draftPostId, notes}` → background revise job; returns `{jobId}`. |
| `/jobs/[id]` | GET | Job status/stage/result for polling. |
| `/cron` | POST | Daily discovery; guarded by `?secret=HERMES_CRON_SECRET` (called by OS crontab, **not** session). |

Publish/discard reuse the **existing** `PATCH /api/blog/posts/[id]`. Draft listing
reuses `getDraftPosts()`; preview reuses `/blog/preview/[id]?token=…`.

---

## 9. Admin UI — "Studio" tab

The admin shell gains navigation: **Comments | Studio** (refactor the current
single-page dashboard into tabbed sections, keeping the redesigned aesthetic —
serif headers, mono eyebrows, accent, pills).

**Studio layout:**
1. **Topics** — today's candidates from `hermes_topics`, with source/score chips
   and a **"Run discovery"** button. Each row: **Draft this** / **Dismiss**.
2. **In-progress** — active `hermes_jobs` with a live stage label
   ("Researching… → Writing… → Checking citations…"), polled every ~2s.
3. **Drafts** — `posts` with status=`draft`: title, dek, category, read-time, and
   actions **Preview** (existing token route), **Revise** (notes textarea →
   revise job), **Publish**, **Discard**. Publishing triggers the existing
   `revalidatePath('/blog')`.
4. Empty/error states; disable buttons while a related job runs.

---

## 10. Telegram notifications (from TS)

Events that ping the Hermes bot/chat (`HERMES_TG_BOT_TOKEN`/`HERMES_TG_CHAT_ID`):
- Daily discovery done → "🔍 N new topics ready in Studio" (+ link to `/admin/studio`).
- Draft job done → "📝 Draft ready: <title>" (+ preview link).
- Draft job error → "❌ Draft failed: <topic> — <error>".
- Published → "✅ Published: <title>" (+ public URL).

No inline keyboards, no polling. (The comments bot + its webhook are untouched.)

---

## 11. Daily cron (single-service friendly)

Server `crontab` entry (replaces `main.py`'s cron):
```
30 1 * * *  curl -fsS -X POST "https://nandankumar.com/api/admin/hermes/cron?secret=$HERMES_CRON_SECRET" >/dev/null 2>&1
```
The `/cron` route validates the secret (constant-time), runs discovery, and
notifies Telegram. Keeps everything inside the one Next service.

---

## 12. Environment variables (add to portfolio `.env.local`)

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Primary writer provider |
| `OPENROUTER_API_KEY`, `WRITER_MODEL`, `FALLBACK_MODELS`, `MODEL_RETRIES` | Fallback chain |
| `TAVILY_API_KEY` | Discovery + research search |
| `HERMES_TG_BOT_TOKEN`, `HERMES_TG_CHAT_ID` | Notifications (reuse the existing Hermes bot) |
| `HERMES_CRON_SECRET` | Guards the daily `/cron` endpoint |
| `MAX_TOPICS`, `MAX_SOURCES_PER_TOPIC` | Tunables (mirror `config.py`) |

(These currently live in `hermes/.env`; copy the values over.)

---

## 13. Decommissioning the Python flow

1. Ship + verify the TS loop in production.
2. Stop the Python daily cron; switch to the OS crontab → `/cron` endpoint.
3. Once notifications + loop are confirmed, **stop `pm2 hermes-bot`** (its
   interactive role is gone). Keep the `hermes/` code in-repo (dormant) until
   you're confident, then remove in a later cleanup.
4. The comments Telegram bot + webhook are **unaffected** throughout.

---

## 14. Build order (each step verified before the next)

1. **DB + data layer** — `hermes_topics`, `hermes_jobs`, `src/lib/hermes/db.ts`, migration script.
2. **`llm.ts`** — provider + fallback; smoke-test a real completion.
3. **`discovery.ts`** — verify it returns interleaved topics and upserts/dedupes.
4. **`research.ts`** — verify extraction quality on a few real URLs vs trafilatura output.
5. **`writer.ts`** — port guardrails; verify a generated draft matches Python behavior (banned-word free, no scaffold headings, descriptive anchors, sources block, sane TOC/read-time).
6. **`jobs.ts` + API routes** — background runner, status polling, stale-job reaper.
7. **Studio UI** — tabbed admin, topics/jobs/drafts, preview/revise/publish/discard.
8. **`notify.ts`** — Telegram pings on the four events.
9. **Daily cron** — OS crontab → `/cron`.
10. **Decommission** Python interactive flow.

---

## 15. Verification

- **Automated:** guardrail unit tests (banned phrases, bare anchors, scaffold
  headings, component sanitizer, sources append, TOC, read-time), discovery
  dedup/interleave, job lifecycle (queued→running→done/error + reaper),
  cron-secret rejection, session-gating of admin routes.
- **Integration (local DB):** full loop on a real topic — discover → draft job
  → draft row created → preview renders → revise job updates it → publish →
  appears on `/blog`.
- **Manual (browser):** Studio UI across the loop; progress polling; error
  states; Telegram pings arrive.
- **Regression:** comments/admin still work; blog pages render; existing
  `/api/blog/posts` publish path unchanged.

---

## 16. Risks & mitigations

| Risk | Mitigation |
|---|---|
| **Writer-port fidelity** (TS output drifts from the hardened Python) | Port prompt + guardrail regexes verbatim; A/B a few drafts against Python before retiring it. |
| **Research extraction quality** (trafilatura → JS) | Use `@extractus/article-extractor` + readability fallback; verify on real URLs; keep raw-text length checks. |
| **Long jobs in one Node process** (restart orphans a job; memory) | DB-backed job rows + stale reaper; one in-flight job per topic/draft; cap concurrency. |
| **LLM latency/cost in the app** | Background jobs (off the request path); reuse the free-model fallback chain. |
| **Cloudflare ~100s timeout** | All heavy work is async + polled; no long synchronous requests. |
| **Secrets now in the web app** | Server-only env (no `NEXT_PUBLIC_`); `hermes-api` not exposed; cron endpoint secret-gated. |
| **Double-trigger / duplicate drafts** | Topic status `drafting` lock + disabled buttons; dedup topics by URL and against existing posts. |

---

## 17. Companion files (to add when building)
- `AUTO_VERIFICATION.md` — the automated coverage above.
- `MANUAL_VERIFICATION.md` — the browser + Telegram walkthrough.
