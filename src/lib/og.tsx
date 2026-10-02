import { ImageResponse } from 'next/og';

// One share-card design for every page (1200×630, the size LinkedIn, X and
// Slack all crop well). Uses ImageResponse's built-in font, so no font files.
export const OG_SIZE = { width: 1200, height: 630 };

const INK = '#14140e', MUTED = '#6b6a5f', BG = '#f6f3eb', ACCENT = '#ff5b2e', LINE = '#d8d3c2';

export function ogCard({ eyebrow, title, sub, chips = [] }: { eyebrow: string; title: string; sub?: string; chips?: string[] }) {
  const size = title.length > 34 ? 76 : title.length > 22 ? 92 : 112;
  // Cut long subtitles at a word boundary so they never crowd the footer.
  const clip = (t?: string, n = 150) => (t && t.length > n ? t.slice(0, t.lastIndexOf(' ', n)).replace(/[,;:.\s—-]+$/, '') + '…' : t);
  sub = clip(sub, title.length > 34 ? 110 : 150);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 72px', background: BG, color: INK, backgroundImage: `radial-gradient(${LINE} 1.4px, transparent 1.4px)`, backgroundSize: '28px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 24, color: MUTED, letterSpacing: 4, textTransform: 'uppercase' }}>
          <div style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT }} />
          {eyebrow}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ fontSize: size, fontWeight: 600, letterSpacing: -3, lineHeight: 1 }}>{title}</div>
          {sub && <div style={{ fontSize: 32, lineHeight: 1.35, color: MUTED, maxWidth: 980 }}>{sub}</div>}
          {chips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {chips.slice(0, 6).map((c) => <div key={c} style={{ display: 'flex', fontSize: 22, padding: '6px 16px', borderRadius: 999, border: `2px solid ${LINE}`, background: '#fbf8ef' }}>{c}</div>)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 24, color: MUTED, borderTop: `2px solid ${LINE}`, paddingTop: 24 }}>
          <div style={{ display: 'flex', color: INK, fontWeight: 600 }}>Nandan Kumar<span style={{ color: ACCENT }}>.</span></div>
          <div style={{ display: 'flex' }}>nandankumar.com</div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
