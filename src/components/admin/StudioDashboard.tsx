'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

type Topic = {
  id: string;
  title: string;
  url: string;
  source: 'hn' | 'tavily';
  score: number;
  status: string;
};
type Job = {
  id: string;
  type: string;
  status: string;
  stage: string | null;
  topicId: string | null;
  error: string | null;
};
type Draft = {
  id: string;
  title: string;
  dek: string | null;
  category: string;
  readingTime: string | null;
  authoredBy: string;
  previewUrl: string;
  updatedAt: string;
};

const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' });

export default function StudioDashboard() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviseFor, setReviseFor] = useState<string | null>(null);
  const [reviseText, setReviseText] = useState('');
  const [msg, setMsg] = useState('');

  const loadAll = useCallback(async () => {
    const [tRes, jRes, dRes] = await Promise.all([
      fetch('/api/admin/hermes/topics', { cache: 'no-store' }),
      fetch('/api/admin/hermes/jobs', { cache: 'no-store' }),
      fetch('/api/admin/hermes/drafts', { cache: 'no-store' }),
    ]);
    if (tRes.status === 401) {
      window.location.assign('/admin/login');
      return;
    }
    if (tRes.ok) setTopics((await tRes.json()).topics ?? []);
    if (jRes.ok) setJobs((await jRes.json()).jobs ?? []);
    if (dRes.ok) setDrafts((await dRes.json()).drafts ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function tick() {
      const [tRes, jRes, dRes] = await Promise.all([
        fetch('/api/admin/hermes/topics', { cache: 'no-store' }),
        fetch('/api/admin/hermes/jobs', { cache: 'no-store' }),
        fetch('/api/admin/hermes/drafts', { cache: 'no-store' }),
      ]);
      if (cancelled) return;
      if (tRes.status === 401) {
        window.location.assign('/admin/login');
        return;
      }
      if (tRes.ok) setTopics((await tRes.json()).topics ?? []);
      if (jRes.ok) setJobs((await jRes.json()).jobs ?? []);
      if (dRes.ok) setDrafts((await dRes.json()).drafts ?? []);
    }
    tick();
    const interval = setInterval(tick, 3500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  async function post(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error ?? 'Something went wrong.');
    }
    await loadAll();
  }

  async function patch(url: string, body: unknown) {
    await fetch(url, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    await loadAll();
  }

  async function runDiscovery() {
    setBusy('discover');
    setMsg('');
    await post('/api/admin/hermes/discover');
    setBusy(null);
  }
  async function draftTopic(id: string) {
    setBusy(id);
    setMsg('');
    await post('/api/admin/hermes/draft', { topicId: id });
    setBusy(null);
  }
  async function submitRevise(id: string) {
    if (!reviseText.trim()) return;
    setBusy(id);
    await post('/api/admin/hermes/revise', { draftPostId: id, notes: reviseText });
    setReviseFor(null);
    setReviseText('');
    setBusy(null);
  }

  const discoverJob = jobs.find((j) => j.type === 'discover');
  const topicJobId = (topicId: string) => jobs.find((j) => j.topicId === topicId);

  return (
    <div className="admin-shell">
      <nav className="admin-nav">
        <a href="https://nandankumar.com" className="nav-logo">
          <span className="dot" aria-hidden="true" />
          nandankumar.com
          <span className="admin-nav-tag">admin</span>
        </a>
        <div className="admin-tabs">
          <Link href="/admin">Comments</Link>
          <Link href="/admin/studio" className="active">Studio</Link>
        </div>
        <div className="admin-nav-right">
          <a href="https://blog.nandankumar.com" className="admin-nav-link" target="_blank" rel="noreferrer">View blog ↗</a>
        </div>
      </nav>

      <main className="admin-main">
        <header className="admin-head">
          <div className="section-eyebrow">Hermes</div>
          <h1>Studio</h1>
          <p className="admin-sub">Discover topics, draft posts, revise, and publish — the full editorial loop.</p>
        </header>

        {/* Active jobs */}
        {jobs.length > 0 ? (
          <section className="studio-jobs">
            {jobs.map((j) => (
              <div key={j.id} className={'studio-job' + (j.status === 'error' ? ' is-error' : '')}>
                <span className="studio-job-type">{j.type}</span>
                <span className="studio-job-stage">{j.error ? j.error : j.stage || j.status}</span>
                <span className="studio-spinner" aria-hidden="true" />
              </div>
            ))}
          </section>
        ) : null}

        {msg ? <p className="admin-error">{msg}</p> : null}

        {/* Topics */}
        <section className="admin-section">
          <div className="studio-section-head">
            <div>
              <div className="section-eyebrow">Topics</div>
              <h2>Today’s candidates</h2>
            </div>
            <button className="btn btn-primary" onClick={runDiscovery} disabled={!!discoverJob || busy === 'discover'}>
              {discoverJob || busy === 'discover' ? 'Discovering…' : 'Run discovery'}
            </button>
          </div>
          {topics.length === 0 ? (
            <p className="admin-empty">No candidate topics. Run discovery to find some.</p>
          ) : (
            <div className="studio-topics">
              {topics.map((t) => {
                const job = topicJobId(t.id);
                const drafting = t.status === 'drafting' || (job && job.status !== 'error');
                return (
                  <article key={t.id} className="studio-topic">
                    <div className="studio-topic-main">
                      <a href={t.url} target="_blank" rel="noreferrer" className="studio-topic-title">{t.title}</a>
                      <div className="studio-topic-meta">
                        <span className={'studio-src studio-src-' + t.source}>{t.source}</span>
                        <span>score {t.score}</span>
                      </div>
                    </div>
                    <div className="studio-topic-actions">
                      <button className="admin-btn" onClick={() => draftTopic(t.id)} disabled={!!drafting || busy === t.id}>
                        {drafting ? 'Drafting…' : 'Draft this'}
                      </button>
                      <button className="admin-btn" onClick={() => patch(`/api/admin/hermes/topics/${t.id}`, { action: 'dismiss' })}>
                        Dismiss
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Drafts */}
        <section className="admin-section">
          <div className="section-eyebrow">Drafts</div>
          <h2>Ready to review</h2>
          {drafts.length === 0 ? (
            <p className="admin-empty">No drafts yet.</p>
          ) : (
            <div className="studio-drafts">
              {drafts.map((d) => (
                <article key={d.id} className="studio-draft">
                  <div className="studio-draft-head">
                    <span className="studio-draft-title">{d.title}</span>
                    {d.authoredBy === 'hermes' ? <span className="comment-badge">Hermes</span> : null}
                  </div>
                  {d.dek ? <p className="studio-draft-dek">{d.dek}</p> : null}
                  <div className="studio-draft-meta">
                    <span>{d.category}</span>
                    {d.readingTime ? <span>{d.readingTime}</span> : null}
                    <span>updated {fmt.format(new Date(d.updatedAt))}</span>
                  </div>
                  <div className="admin-actions">
                    <a className="admin-btn" href={d.previewUrl} target="_blank" rel="noreferrer">Preview</a>
                    <button className="admin-btn" onClick={() => { setReviseFor(reviseFor === d.id ? null : d.id); setReviseText(''); }}>
                      {reviseFor === d.id ? 'Cancel' : 'Revise'}
                    </button>
                    <button className="admin-btn" onClick={() => patch(`/api/admin/hermes/drafts/${d.id}`, { action: 'publish' })} disabled={busy === d.id}>Publish</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => patch(`/api/admin/hermes/drafts/${d.id}`, { action: 'discard' })} disabled={busy === d.id}>Discard</button>
                  </div>
                  {reviseFor === d.id ? (
                    <div className="admin-reply">
                      <textarea value={reviseText} onChange={(e) => setReviseText(e.target.value)} rows={3} placeholder="Revision notes — what to change…" autoFocus />
                      <button className="btn btn-primary" disabled={busy === d.id || !reviseText.trim()} onClick={() => submitRevise(d.id)}>Send revision</button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
