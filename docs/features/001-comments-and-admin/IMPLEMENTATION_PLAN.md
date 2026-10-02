# Feature 001 — Blog Comments + Owner `/admin` Panel

Status: **Planned** (not started)
Author: Nandan Kumar
Last updated: 2026-05-29

---

## 1. Summary

Add a comment section to every blog post, plus an owner-only `/admin` panel for
moderation. Visitors comment anonymously (name only, no login, no cookies).
Comments appear instantly (post-moderation). Only the owner can delete or
restore them, reply as a verified author, and is notified of every new comment
in Telegram with one-tap **Delete** / **Reply** buttons.

This is **v1: comments moderation only**. The `/admin` panel is deliberately
scoped to comments; post/subscriber/Hermes management are explicitly out of
scope for this feature (see §12).

---

## 2. Decisions (resolved during design review)

| # | Decision | Choice |
|---|---|---|
| 1 | Commenter identity | **Anonymous + name.** Email optional, stored, never shown publicly. No visitor cookies. |
| 2 | Owner authentication | **Password → signed `httpOnly` session cookie.** Built from scratch (no auth exists today). |
| 3 | Moderation timing | **Post-moderation.** Comments are publicly visible immediately; owner soft-deletes bad ones. |
| 4 | Spam defense | **Honeypot + server-side rate-limiting.** No third-party services, no CAPTCHA, no extra cookies. |
| 5 | Owner identity in thread | **Verified author badge + reserved name.** Owner replies are badged; "Nandan Kumar" (+ variants) blocked for anonymous commenters. |
| 6 | New-comment notification | **Telegram ping with Delete + Reply buttons.** |
| 7 | Delete semantics | **Soft-delete** (`status='deleted'`, row retained). Reversible. |
| 8 | Comment body format | **Plain text only.** Server-escaped, newlines preserved, no HTML/markdown. URLs render as text (not links). |
| 9 | Telegram wiring | **Separate dedicated bot + webhook → Next.js route.** Hermes (polling) is untouched. |
| 10 | Threading | **One-level replies.** A reply's parent must be a top-level comment. |
| 11 | `/admin` scope (v1) | **Comments moderation only.** |
| 12 | IP storage | **Raw IP stored** (owner's explicit choice; see privacy note §11). |
| 13 | `/admin` location | **Main domain:** `nandankumar.com/admin`. |
| 14 | Telegram actions (v1) | **Delete + Reply** (reply via Telegram force-reply, posted as badged author). |
| 15 | Comments enablement | **All published posts**, with a **global kill-switch** (env) + **per-post flag**. |

### Defaulted open questions (adjustable)

- **Ordering:** oldest-first (classic discussion flow), newest reply nested under its parent.
- **Author reply display:** shows the author badge **and** the date.
- **Notification channel:** Telegram is the **sole** channel for v1. If the notify
  call fails, the comment still saves (notification is fire-and-forget; failure is
  logged, never blocks the visitor).

---

## 3. What this feature does NOT do (yet)

- No commenter accounts, logins, or visitor cookies of any kind.
- No commenter self-edit or self-delete (anonymous → no ownership to prove).
- No nested threading beyond one level.
- No post/draft/subscriber management in `/admin`.
- No third-party spam service (Akismet) or CAPTCHA.
- No email notifications.
- No edit-comment capability for the owner (delete/restore + reply only).
- No automated IP geolocation (raw IP is stored but not enriched in v1).

---

## 4. Allowed change area

```
src/lib/blog/comments.ts          (new — data layer)
src/lib/blog/types.ts             (extend — Comment types)
src/lib/auth.ts                   (new — session sign/verify, password check)
src/lib/rate-limit.ts             (new — IP rate limiting)
src/app/api/blog/comments/route.ts            (new — GET list, POST create)
src/app/api/blog/comments/[id]/route.ts       (new — PATCH delete/restore)
src/app/api/admin/login/route.ts              (new)
src/app/api/admin/logout/route.ts             (new)
src/app/api/telegram/webhook/[secret]/route.ts (new)
src/app/admin/                                 (new — login + moderation UI)
src/components/blog/Comments.tsx               (new — server list)
src/components/blog/CommentForm.tsx            (new — client form)
src/components/blog/CommentItem.tsx            (new)
src/app/blog/[slug]/page.tsx      (edit — mount <Comments/>)
src/app/globals.css               (edit — comment + admin styles)
src/proxy.ts                      (verify — /admin unaffected; add admin noindex if needed)
src/app/robots.txt or robots route (edit — disallow /admin)
scripts/migrate-comments.ts       (new — idempotent schema migration)
scripts/set-telegram-webhook.ts   (new — one-time webhook registration)
.env.local / server .env          (new vars — see §10)
```

Lock files, deploy script, and Hermes are **out of the change area**.

---

## 5. Data model

### 5.1 Table DDL (idempotent migration)

```sql
CREATE TABLE IF NOT EXISTS comments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id     uuid REFERENCES comments(id) ON DELETE CASCADE,
  author_name   text NOT NULL,
  author_email  text,
  body          text NOT NULL,
  is_author     boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'visible',  -- 'visible' | 'deleted'
  ip            text,
  user_agent    text,
  tg_message_id bigint,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comments_post_idx   ON comments (post_id, status, created_at);
CREATE INDEX IF NOT EXISTS comments_parent_idx ON comments (parent_id);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS comments_enabled boolean NOT NULL DEFAULT true;
```

### 5.2 Invariants (enforced in code)

- **One-level only:** when `parent_id` is set, the referenced row must have
  `parent_id IS NULL`. Reject otherwise (422).
- `author_name`: trimmed, 1–60 chars.
- `body`: trimmed, 1–3000 chars, plain text.
- `author_email`: optional; if present, must look like an email; **never**
  serialized to the public API.
- `is_author=true` may only be set by an owner-authenticated path.
- Public reads return only `status='visible'`.

### 5.3 TypeScript types (`src/lib/blog/types.ts`)

```ts
export type CommentStatus = 'visible' | 'deleted';

export interface PublicComment {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isAuthor: boolean;
  createdAt: string;
  replies?: PublicComment[];   // one level, only on top-level items
}

// Admin-only shape adds email, ip, userAgent, status.
export interface AdminComment extends PublicComment {
  authorEmail: string | null;
  ip: string | null;
  userAgent: string | null;
  status: CommentStatus;
  postSlug: string;
  postTitle: string;
}
```

---

## 6. API surface

### 6.1 Public

**`GET /api/blog/comments?post=<slug>`**
- Returns `{ comments: PublicComment[], count: number }`, `status='visible'`,
  oldest-first, replies grouped under their parent (one level).
- Strips `email`, `ip`, `userAgent`.

**`POST /api/blog/comments`**
- Body: `{ postSlug, authorName, authorEmail?, body, parentId?, website? }`
  (`website` = honeypot; real users leave it blank).
- Guard order (fail fast, generic 400/422/429 messages — never reveal which guard tripped for spam):
  1. Global `COMMENTS_ENABLED` true **and** post `comments_enabled` true → else 403 closed.
  2. Honeypot `website` empty → else silently 200 (pretend success, drop).
  3. Rate-limit by raw IP: ≤ 3 comments / 10 min, ≥ 10 s since last, body ≤ 3 URLs → else 429.
  4. Validation (lengths, one-level parent, email shape) → else 422.
  5. Reserved-name check: normalized name ≠ owner name set → else 422 ("that name is reserved").
  6. Insert `visible`, capture `ip` (`x-forwarded-for` first hop) + `user_agent`.
  7. Fire-and-forget Telegram notify (§8). Failure logged, not surfaced.
- Returns the created `PublicComment`.

### 6.2 Owner-authenticated (session cookie) or webhook-secret

**`PATCH /api/blog/comments/[id]`** `{ action: 'delete' | 'restore' }`
- Auth: valid owner session cookie **or** internal call from the verified webhook.
- Flips `status`. Returns updated `AdminComment`.

**`POST /api/blog/comments`** with `asAuthor: true`
- Requires owner session. Forces `is_author=true`, `author_name` = owner name,
  ignores honeypot/rate-limit. Used by `/admin` reply box.

### 6.3 Auth

**`POST /api/admin/login`** `{ password }`
- Constant-time compare against `ADMIN_PASSWORD_HASH` (bcrypt/scrypt).
- On success set cookie `admin_session` = signed JWT (HS256 via `ADMIN_SESSION_SECRET`),
  `httpOnly; Secure; SameSite=Lax; Path=/; Max-Age=7d`.
- Login attempts rate-limited by IP (≤ 5 / 15 min).

**`POST /api/admin/logout`** — clears the cookie.

### 6.4 Telegram webhook

**`POST /api/telegram/webhook/[secret]`**
- Reject unless path `[secret]` == `TELEGRAM_WEBHOOK_SECRET` **and** header
  `X-Telegram-Bot-Api-Secret-Token` matches **and** update's chat id ∈ allow-list.
- Handles:
  - **callback_query** `del:<commentId>` → soft-delete, answer + edit message to "🗑 Deleted".
  - **callback_query** `rep:<commentId>` → send a force-reply prompt.
  - **message** that is a reply to a force-reply prompt → resolve target comment via
    `tg_message_id`, insert badged author reply (`parent_id` = top-level ancestor), confirm.

---

## 7. Authentication & session

- `src/lib/auth.ts`: `hashPassword`, `verifyPassword` (constant-time),
  `signSession`, `verifySession`, `getSessionFromRequest`.
- Session = compact JWT `{ sub: 'owner', iat, exp }`, signed `ADMIN_SESSION_SECRET`.
- `/admin/**` pages: server-side guard reads the cookie; unauthenticated →
  render login form (no redirect leak). API routes: 401 on missing/invalid session.
- Only the **owner** ever receives a cookie. Visitors remain cookieless.

---

## 8. Telegram (separate bot)

- A **new** bot (via @BotFather) with its own token `COMMENTS_TG_BOT_TOKEN`,
  distinct from Hermes' token (two polling/webhook clients can't share a token).
- Webhook registered once via `scripts/set-telegram-webhook.ts`
  (`setWebhook` with `url=https://nandankumar.com/api/telegram/webhook/<secret>`,
  `secret_token=<header secret>`, `allowed_updates=['message','callback_query']`).
- New-comment notification message:
  ```
  💬 New comment on "<post title>"
  <author name>:
  <body excerpt>
  [🗑 Delete] [↩ Reply]
  ```
  We store the sent message's `message_id` in `comments.tg_message_id` so a
  force-reply maps back to the right comment.
- Notification send lives in `src/lib/notify.ts`; called fire-and-forget from POST.

---

## 9. Frontend

### Post page (`src/app/blog/[slug]/page.tsx`)
- Below the article, before the pager, mount `<Comments postId postSlug commentsEnabled />`.
- Comments render **server-side** (page is already `force-dynamic`) for SEO + no flash.

### Components
- `Comments.tsx` (server): fetches visible comments, renders count + list +
  `<CommentForm/>`. Shows a "comments are closed" note when disabled.
- `CommentItem.tsx`: name (+ "Author" badge styled like `HermesBadge` when
  `isAuthor`), relative date, escaped body, one indented level of replies, a
  "Reply" affordance that targets the top-level parent.
- `CommentForm.tsx` (client): name + optional email + body + hidden honeypot
  (`website`, visually hidden, `tabindex=-1`, `autocomplete=off`). Posts to the
  API, optimistic append, inline error for 429/422, no cookies set. "Load more"
  after 20.

### Styling (`globals.css`)
- Reuse the mono/serif/accent system. Author badge mirrors `.hermes-badge`.
  Replies indented with a left accent rule. Form matches the subscribe form.

---

## 10. Environment variables

| Var | Where | Purpose |
|---|---|---|
| `ADMIN_PASSWORD_HASH` | server | bcrypt/scrypt hash of the admin password |
| `ADMIN_SESSION_SECRET` | server | HMAC secret for session JWT |
| `COMMENTS_TG_BOT_TOKEN` | server | dedicated comments bot token |
| `COMMENTS_TG_CHAT_ID` | server | owner chat id (notify target + allow-list) |
| `TELEGRAM_WEBHOOK_SECRET` | server | path + header secret for the webhook |
| `COMMENTS_ENABLED` | server | global kill-switch (`true`/`false`) |
| `OWNER_DISPLAY_NAME` | server | reserved name + author reply name (default "Nandan Kumar") |

All server-only (no `NEXT_PUBLIC_`). Added to server `.env`; documented in
`CLAUDE.md` env table during implementation.

---

## 11. Security & privacy notes

- **Raw IP is PII at rest.** Per owner decision it is stored plain. Recommended
  companion change: a one-line disclosure ("comments store your IP address for
  spam prevention") near the comment form or in a short privacy note. The footer
  no longer claims "No cookies" (removed in an earlier change), so no direct
  contradiction remains — but disclosure is still the right move.
- **Owner cookie only.** `/admin` sets one `httpOnly` session cookie for the
  owner. Visitor-facing pages set **zero** cookies.
- **`/admin` exposure:** `noindex` meta + `Disallow: /admin` in robots. Hitting
  `blog.nandankumar.com/admin` naturally 404s (proxy rewrites it to `/blog/admin`).
  Verify `proxy.ts` leaves main-domain `/admin` untouched.
- **Webhook hardening:** secret path segment **and** `X-Telegram-Bot-Api-Secret-Token`
  header **and** chat-id allow-list, all required.
- **XSS:** plain-text bodies are escaped on render; no `dangerouslySetInnerHTML`
  for comment content.
- **Two bots:** Hermes (polling) + Comments (webhook) must use different tokens.

---

## 12. Build order (each step verified before the next)

1. **Migration + data layer.** `scripts/migrate-comments.ts`, `comments.ts`
   CRUD, types. Verify on server DB.
2. **Public API + spam guards.** GET/POST with honeypot + rate-limit, no UI.
   Verify via curl (happy path, honeypot, rate-limit, reserved name, one-level).
3. **Post-page rendering + form.** Server list + client form. Verify in browser.
4. **Owner auth + `/admin` UI.** Login/session/logout, moderation table,
   soft-delete/restore, badged reply, block-by-IP list.
5. **Telegram bot + webhook.** Notify on new comment; Delete + Reply callbacks.
   Verify end-to-end from phone.
6. **Toggles + polish + regression.** Global + per-post enable, "closed" state,
   styling pass, re-run blog page checks (Feature: Share button, theme, proxy).

---

## 13. Verification (see companion files)

- `AUTO_VERIFICATION.md`: data-layer + API + guard unit/integration coverage
  (validation, one-level parent rejection, honeypot drop, rate-limit, reserved
  name, soft-delete hides from public, email/ip never leak publicly, session
  sign/verify, webhook secret rejection).
- `MANUAL_VERIFICATION.md`: browser + Telegram walkthroughs (post a comment,
  reply, see it live, get the Telegram ping, Delete from phone → disappears,
  Reply from phone → badged author reply appears, login to `/admin`, restore a
  deleted comment, per-post + global disable, cookieless check in devtools,
  `/admin` is noindex + 404 on blog subdomain).

---

## 14. Regression checks

- Existing blog post page still renders (Share button, TOC, theme, pager).
- `proxy.ts` `/blog` canonicalization + clean URLs unaffected.
- Build (`npm run build`) and lint clean; blog pages remain `force-dynamic`.
- Hermes flow unaffected (separate bot/token; no shared code touched).
