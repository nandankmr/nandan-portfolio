import { NextRequest, NextResponse } from 'next/server';

interface ContactPayload {
  name: string;
  email: string;
  company?: string;
  message: string;
}

function validate(body: Partial<ContactPayload>): string | null {
  if (!body.name?.trim()) return 'Name is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email?.trim() ?? '')) return 'Valid email is required.';
  if ((body.message?.trim().length ?? 0) < 10) return 'Message is too short.';
  return null;
}

export async function POST(req: NextRequest) {
  let body: Partial<ContactPayload>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 422 });

  // Log to console for now; swap in Resend / Nodemailer / SES as needed.
  console.log('[contact]', {
    name: body.name,
    email: body.email,
    company: body.company ?? '',
    message: body.message,
    ts: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
