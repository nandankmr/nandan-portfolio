const items = [
  'Next.js', 'Nest.js', 'LangGraph', 'AWS', 'PostgreSQL',
  'TypeScript', 'React', 'Python', 'ChromaDB', 'Twilio', 'Deepgram', 'Claude Code',
];

export default function Marquee() {
  const dup = [...items, ...items];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {dup.map((s, i) => (
          <span key={i}><span className="dot">★</span>{s}</span>
        ))}
      </div>
    </div>
  );
}
