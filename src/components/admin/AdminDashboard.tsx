'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type AdminComment = {
  id: string;
  parentId: string | null;
  postSlug: string;
  postTitle: string;
  authorName: string;
  authorEmail: string | null;
  body: string;
  isAuthor: boolean;
  status: 'visible' | 'deleted';
  ip: string;
  userAgent: string;
  createdAt: string;
};

type AdminPost = { id: string; slug: string; title: string; comments_enabled: boolean };
type IpBlock = { ip: string; reason: string | null; created_at: string };

const fmtDate = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export default function AdminDashboard() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [blocks, setBlocks] = useState<IpBlock[]>([]);
  const [postFilter, setPostFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (postFilter) params.set('post', postFilter);
    if (statusFilter) params.set('status', statusFilter);
    return params.toString();
  }, [postFilter, statusFilter]);

  async function load() {
    const res = await fetch(`/api/admin/comments?${query}`, { cache: 'no-store' });
    if (res.status === 401) {
      window.location.assign('/admin/login');
      return;
    }
    const data = await res.json();
    setComments(data.comments ?? []);
    setPosts(data.posts ?? []);

    const blockRes = await fetch('/api/admin/ip-blocks', { cache: 'no-store' });
    if (blockRes.ok) setBlocks((await blockRes.json()).blocks ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadForQuery() {
      const res = await fetch(`/api/admin/comments?${query}`, { cache: 'no-store' });
      if (cancelled) return;
      if (res.status === 401) {
        window.location.assign('/admin/login');
        return;
      }
      const data = await res.json();
      setComments(data.comments ?? []);
      setPosts(data.posts ?? []);

      const blockRes = await fetch('/api/admin/ip-blocks', { cache: 'no-store' });
      if (!cancelled && blockRes.ok) setBlocks((await blockRes.json()).blocks ?? []);
    }

    loadForQuery();
    return () => {
      cancelled = true;
    };
  }, [query]);

  async function mutateComment(id: string, action: 'delete' | 'restore') {
    setBusy(id);
    await fetch(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    await load();
    setBusy(null);
  }

  async function submitReply(comment: AdminComment) {
    if (!replyText.trim()) return;
    setBusy(comment.id);
    await fetch('/api/blog/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ post: comment.postSlug, parentId: comment.parentId ?? comment.id, body: replyText }),
    });
    setReplyFor(null);
    setReplyText('');
    await load();
    setBusy(null);
  }

  async function blockIp(ip: string) {
    await fetch('/api/admin/ip-blocks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ip, reason: 'Blocked from admin' }),
    });
    await load();
  }

  async function unblockIp(ip: string) {
    await fetch(`/api/admin/ip-blocks/${encodeURIComponent(ip)}`, { method: 'DELETE' });
    await load();
  }

  async function togglePost(post: AdminPost) {
    await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ commentsEnabled: !post.comments_enabled }),
    });
    await load();
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.assign('/admin/login');
  }

  const stats = useMemo(() => {
    const visible = comments.filter((c) => c.status === 'visible').length;
    const deleted = comments.filter((c) => c.status === 'deleted').length;
    return { total: comments.length, visible, deleted, blocked: blocks.length };
  }, [comments, blocks]);

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <a href="https://nandankumar.com" className="nav-logo">
          <span className="dot" aria-hidden="true" />
          nandankumar.com
          <span className="admin-nav-tag">admin</span>
        </a>
        <div className="admin-tabs">
          <Link href="/admin" className="active">Comments</Link>
          <Link href="/admin/studio">Studio</Link>
        </div>
        <div className="admin-nav-right">
          <a href="https://blog.nandankumar.com" className="admin-nav-link" target="_blank" rel="noreferrer">
            View blog ↗
          </a>
          <button className="btn admin-logout" onClick={logout}>Log out</button>
        </div>
      </nav>

      <main className="admin-main">
        <header className="admin-head">
          <div className="section-eyebrow">Moderation</div>
          <h1>Comments</h1>
          <p className="admin-sub">Review, reply to, and remove comments across the blog.</p>
        </header>

        <div className="admin-stats">
          <div className="admin-stat"><span className="admin-stat-num">{stats.total}</span><span className="admin-stat-label">in view</span></div>
          <div className="admin-stat"><span className="admin-stat-num">{stats.visible}</span><span className="admin-stat-label">visible</span></div>
          <div className="admin-stat"><span className="admin-stat-num">{stats.deleted}</span><span className="admin-stat-label">deleted</span></div>
          <div className="admin-stat"><span className="admin-stat-num">{stats.blocked}</span><span className="admin-stat-label">blocked IPs</span></div>
        </div>

        <div className="admin-toolbar">
          <label className="admin-field">
            <span>Post</span>
            <select value={postFilter} onChange={(e) => setPostFilter(e.target.value)}>
              <option value="">All posts</option>
              {posts.map((post) => <option key={post.id} value={post.slug}>{post.title}</option>)}
            </select>
          </label>
          <label className="admin-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="visible">Visible</option>
              <option value="deleted">Deleted</option>
            </select>
          </label>
        </div>

        <section className="admin-comments">
          {comments.length === 0 ? (
            <p className="admin-empty">No comments match this view.</p>
          ) : comments.map((comment) => (
            <article key={comment.id} className={'admin-comment' + (comment.status === 'deleted' ? ' is-deleted' : '')}>
              <div className="admin-comment-top">
                <span className="admin-comment-author">
                  {comment.authorName}
                  {comment.isAuthor ? <span className="comment-badge">Author</span> : null}
                </span>
                <span className={'admin-status admin-status-' + comment.status}>{comment.status}</span>
                <time className="admin-comment-date">{fmtDate.format(new Date(comment.createdAt))}</time>
              </div>

              <p className="admin-comment-body">{comment.body}</p>

              <div className="admin-comment-meta">
                <a href={`https://blog.nandankumar.com/${comment.postSlug}#comments`} target="_blank" rel="noreferrer">
                  {comment.postTitle}
                </a>
                <span>{comment.authorEmail || 'no email'}</span>
                <code>{comment.ip}</code>
              </div>

              <div className="admin-actions">
                <button
                  className="admin-btn"
                  disabled={busy === comment.id}
                  onClick={() => mutateComment(comment.id, comment.status === 'visible' ? 'delete' : 'restore')}
                >
                  {comment.status === 'visible' ? 'Delete' : 'Restore'}
                </button>
                <button className="admin-btn" onClick={() => { setReplyFor(replyFor === comment.id ? null : comment.id); setReplyText(''); }}>
                  {replyFor === comment.id ? 'Cancel' : 'Reply'}
                </button>
                <button className="admin-btn admin-btn-danger" onClick={() => blockIp(comment.ip)}>Block IP</button>
              </div>

              {replyFor === comment.id ? (
                <div className="admin-reply">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    placeholder="Reply as Nandan Kumar (verified author)…"
                    autoFocus
                  />
                  <button className="btn btn-primary" disabled={busy === comment.id || !replyText.trim()} onClick={() => submitReply(comment)}>
                    Post author reply
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>

        <section className="admin-section">
          <div className="section-eyebrow">Threads</div>
          <h2>Comments per post</h2>
          <div className="admin-post-grid">
            {posts.map((post) => (
              <button
                key={post.id}
                className={'admin-post-toggle' + (post.comments_enabled ? ' is-on' : '')}
                onClick={() => togglePost(post)}
              >
                <span className="admin-post-title">{post.title}</span>
                <span className="admin-post-state">
                  <span className="admin-dot" aria-hidden="true" />
                  {post.comments_enabled ? 'Open' : 'Closed'}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <div className="section-eyebrow">Spam control</div>
          <h2>Blocked IPs</h2>
          {blocks.length === 0 ? (
            <p className="admin-empty">No blocked addresses.</p>
          ) : (
            <div className="admin-block-list">
              {blocks.map((block) => (
                <div className="admin-block" key={block.ip}>
                  <code>{block.ip}</code>
                  {block.reason ? <span className="admin-block-reason">{block.reason}</span> : null}
                  <button className="admin-btn" onClick={() => unblockIp(block.ip)}>Unblock</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
