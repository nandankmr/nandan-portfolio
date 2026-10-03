'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';

const Turnstile = dynamic(() => import('@marsidev/react-turnstile').then((mod) => mod.Turnstile), { ssr: false });
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { SITE } from '@/lib/data';
import { BLOG_LABEL, blogUrl } from '@/lib/blog/urls';

type Status = 'idle' | 'sending' | 'sent' | 'error';

// One click to put the address on the clipboard: recruiters paste it into ATS / email.
function CopyEmail({ email }: { email: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={'contact-copy' + (done ? ' done' : '')}
      onClick={async () => {
        try { await navigator.clipboard.writeText(email); setDone(true); setTimeout(() => setDone(false), 1800); } catch { window.location.href = `mailto:${email}`; }
      }}
    >
      <span aria-live="polite">{done ? 'Copied ✓' : 'Copy email'}</span>
    </button>
  );
}



const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

function Field({ label, required, optional, children }: {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {label}
        {required && <span className="field-req">*</span>}
        {optional && <span className="field-opt"> (optional)</span>}
      </span>
      {children}
    </label>
  );
}

export default function Contact() {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [values, setValues] = useState({ name: '', email: '', company: '', message: '' });

  // The ⌘K "hire" easter egg pre-fills the message (never overwrites typed text).
  useEffect(() => {
    const onPrefill = (e: Event) => setValues((v) => (v.message ? v : { ...v, message: (e as CustomEvent<string>).detail }));
    window.addEventListener('pf:prefill', onPrefill);
    return () => window.removeEventListener('pf:prefill', onPrefill);
  }, []);

  const captchaToken = useRef<string>('');
  const turnstileRef = useRef<TurnstileInstance>(undefined);

  const onChange = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const validate = () => {
    if (!values.name.trim()) return 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) return 'Please enter a valid email.';
    if (values.message.trim().length < 10) return 'A few more words about what you have in mind?';
    if (SITE_KEY && !captchaToken.current) return 'Please complete the verification.';
    return '';
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const honeypot = form.elements.namedItem('website') as HTMLInputElement | null;
    if (honeypot?.value) return;

    const err = validate();
    if (err) { setStatus('error'); setErrorMsg(err); return; }

    setStatus('sending');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, captchaToken: captchaToken.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Server responded ' + res.status);
      }
      setStatus('sent');
      setValues({ name: '', email: '', company: '', message: '' });
      // Reset widget for next submission
      captchaToken.current = '';
      turnstileRef.current?.reset();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Try the email link on the right?');
    }
  };

  return (
    <section id="contact" className="contact">
      <div className="container">
        <div className="section-eyebrow" data-reveal>· Contact</div>
        <h2 data-reveal>
          Hiring a senior engineer<br />
          who&apos;s serious about <span className="accent">shipping</span>?<br />
          Let&apos;s talk.
        </h2>

        <div className="contact-grid">
          <form className="contact-form" onSubmit={onSubmit} noValidate data-reveal style={{ '--rev-delay': '120ms' } as React.CSSProperties}>
            <div className="form-row form-row-2">
              <Field label="Name" required>
                <input type="text" name="name" autoComplete="name" required value={values.name} onChange={onChange('name')} placeholder="Your name" />
              </Field>
              <Field label="Email" required>
                <input type="email" name="email" autoComplete="email" required value={values.email} onChange={onChange('email')} placeholder="you@company.com" />
              </Field>
            </div>
            <Field label="Company / role" optional>
              <input type="text" name="company" autoComplete="organization" value={values.company} onChange={onChange('company')} placeholder="Acme Inc. · Eng manager" />
            </Field>
            <Field label="What's the role / project?" required>
              <textarea
                name="message"
                rows={6}
                required
                value={values.message}
                onChange={onChange('message')}
                placeholder="A bit about the team, the problem, and the stack. Real salary band welcome."
              />
            </Field>
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="honeypot" aria-hidden="true" />

            {SITE_KEY && (
              <div className="captcha-row">
                <span className="captcha-label">Verification</span>
                <div className="captcha-widget">
                  <Turnstile
                    ref={turnstileRef}
                    siteKey={SITE_KEY}
                    options={{ theme: 'auto', appearance: 'always' }}
                    onSuccess={(token) => { captchaToken.current = token; }}
                    onError={() => { captchaToken.current = 'error_fallback'; }}
                    onExpire={() => { captchaToken.current = ''; }}
                  />
                </div>
              </div>
            )}

            <div className="form-foot">
              <button type="submit" className="form-submit" disabled={status === 'sending'}>
                {status === 'sending' && 'Sending…'}
                {status === 'sent' && 'Sent ✓'}
                {(status === 'idle' || status === 'error') && (<>Send message <span className="form-arrow">↗</span></>)}
              </button>
              <div className="form-msg">
                {status === 'sent' && <span className="form-msg-ok">Thanks. I&apos;ll reply within 48 hours.</span>}
                {status === 'error' && <span className="form-msg-err">{errorMsg}</span>}
              </div>
            </div>
          </form>

          <aside className="contact-side" data-reveal style={{ '--rev-delay': '200ms' } as React.CSSProperties}>
            <div className="contact-side-head">
              <div className="contact-side-title">Direct channels</div>
              <CopyEmail email={SITE.email} />
            </div>
            <div className="contact-links">
              {[
                { l: 'Email', v: SITE.email, href: `mailto:${SITE.email}` },
                { l: 'Phone', v: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, '')}` },
                { l: 'LinkedIn', v: SITE.linkedin, href: `https://${SITE.linkedin}` },
                { l: 'Blog', v: BLOG_LABEL, href: blogUrl() },
                { l: 'Résumé', v: 'Download PDF', href: SITE.resume, download: true },
              ].map((x) => (
                <a
                  key={x.l}
                  href={x.href}
                  download={x.download ? true : undefined}
                  target={x.download ? undefined : '_blank'}
                  rel="noreferrer"
                  className="contact-link"
                >
                  <div>
                    <span className="contact-link-label">{x.l}</span>
                    <span className="contact-link-value">{x.v}</span>
                  </div>
                  <span className="contact-arrow">↗</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
