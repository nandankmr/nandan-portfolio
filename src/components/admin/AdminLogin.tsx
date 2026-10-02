'use client';

import { useState } from 'react';

export default function AdminLogin() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password: form.get('password') }),
    });
    setLoading(false);
    if (res.ok) {
      window.location.assign('/admin');
      return;
    }
    const data = await res.json().catch(() => ({}));
    setMessage(data.error ?? 'Login failed.');
  }

  return (
    <main className="admin-shell admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <span className="nav-logo admin-login-logo">
          <span className="dot" aria-hidden="true" />
          nandankumar.com
        </span>
        <div className="section-eyebrow">Admin</div>
        <h1>Comment moderation</h1>
        <p className="admin-sub">Sign in to review and moderate blog comments.</p>
        <label className="admin-field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required autoFocus />
        </label>
        <button className="btn btn-primary admin-login-btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
        {message ? <p className="admin-error">{message}</p> : null}
      </form>
    </main>
  );
}
