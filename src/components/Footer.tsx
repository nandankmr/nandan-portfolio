'use client';
import { useEffect, useState } from 'react';
import { SITE } from '@/lib/data';

function formatIST() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 5.5 * 3600 * 1000);
  return ist.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function Footer() {
  const [t, setT] = useState('');
  useEffect(() => {
    setT(formatIST());
    const id = setInterval(() => setT(formatIST()), 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer>
      <span>© {new Date().getFullYear()} Nandan Kumar · v 1.0</span>
      <span>{SITE.location}{t ? ` · ${t} ${SITE.timezone}` : ''}</span>
      <span>Built by hand · No analytics · No cookies</span>
    </footer>
  );
}
