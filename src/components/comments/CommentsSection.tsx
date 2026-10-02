'use client';

import { useState } from 'react';
import type { PublicComment } from '@/lib/comments/types';

function CommentCard({ comment, onReply }: { comment: PublicComment; onReply: (comment: PublicComment) => void }) {
  return (
    <article className="comment-card">
      <div className="comment-head">
        <span className="comment-author">
          {comment.authorName}
          {comment.isAuthor ? <span className="comment-badge">Author</span> : null}
        </span>
        <time>{new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(comment.createdAt))}</time>
      </div>
      <p>{comment.body}</p>
      <button type="button" className="comment-reply" onClick={() => onReply(comment)}>Reply</button>
      {comment.replies.length ? (
        <div className="comment-replies">
          {comment.replies.map((reply) => <CommentCard key={reply.id} comment={reply} onReply={onReply} />)}
        </div>
      ) : null}
    </article>
  );
}

export default function CommentsSection({
  postSlug,
  initialComments,
  total,
  commentsEnabled,
}: {
  postSlug: string;
  initialComments: PublicComment[];
  total: number;
  commentsEnabled: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [count, setCount] = useState(total);
  const [replyTo, setReplyTo] = useState<PublicComment | null>(null);
  const [message, setMessage] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    const res = await fetch(`/api/blog/comments?post=${encodeURIComponent(postSlug)}&limit=${Math.max(20, comments.length)}`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setComments(data.comments);
      setCount(data.total);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    const res = await fetch(`/api/blog/comments?post=${encodeURIComponent(postSlug)}&offset=${comments.length}&limit=20`, { cache: 'no-store' });
    const data = await res.json();
    if (res.ok) {
      setComments((prev) => [...prev, ...data.comments]);
      setCount(data.total);
    }
    setLoadingMore(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    setSubmitting(true);
    setMessage('');
    const form = new FormData(formEl);
    const payload = {
      post: postSlug,
      parentId: replyTo ? replyTo.parentId ?? replyTo.id : undefined,
      authorName: form.get('authorName'),
      authorEmail: form.get('authorEmail'),
      body: form.get('body'),
      website: form.get('website'),
    };

    const res = await fetch('/api/blog/comments', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setMessage(data.error ?? 'Could not post comment.');
      return;
    }

    formEl.reset();
    setReplyTo(null);
    setMessage('Comment posted.');
    await reload();
  }

  return (
    <section className="comments-section" id="comments">
      <div className="comments-head">
        <span className="section-eyebrow">· Comments</span>
        <h2>{count ? `${count} comment${count === 1 ? '' : 's'}` : 'Join the discussion'}</h2>
      </div>

      {comments.length ? (
        <div className="comment-list">
          {comments.map((comment) => <CommentCard key={comment.id} comment={comment} onReply={setReplyTo} />)}
        </div>
      ) : (
        <p className="comments-empty">No comments yet.</p>
      )}

      {comments.length < count ? (
        <button type="button" className="btn comments-load-more" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      ) : null}

      {commentsEnabled ? (
        <form className="comment-form" onSubmit={submit}>
          {replyTo ? (
            <div className="comment-replying">
              Replying to {replyTo.authorName}
              <button type="button" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          ) : null}
          <input name="website" tabIndex={-1} autoComplete="off" className="comment-hp" aria-hidden="true" />
          <div className="comment-form-row">
            <label>
              Name
              <input name="authorName" maxLength={60} required />
            </label>
            <label>
              Email <span>optional, never shown</span>
              <input name="authorEmail" type="email" />
            </label>
          </div>
          <label>
            Comment
            <textarea name="body" maxLength={3000} required rows={5} />
          </label>
          <button className="btn btn-primary" disabled={submitting}>{submitting ? 'Posting...' : 'Post comment'}</button>
          <p className="comment-privacy">
            Comments store your raw IP address and user agent for spam prevention and moderation.
            Email is never shown publicly.
          </p>
          {message ? <p className="comment-message">{message}</p> : null}
        </form>
      ) : (
        <p className="comments-closed">Comments are closed for this thread.</p>
      )}
    </section>
  );
}
