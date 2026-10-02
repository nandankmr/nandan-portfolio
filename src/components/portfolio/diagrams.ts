// Simplified architecture sketches per project. Components come from the
// project data; the wiring between them is a reconstruction — keep it honest.
// Coordinates are top-left of each node in a 960×400 viewBox (node 150×58).

export type DNode = { id: string; x: number; y: number; label: string; sub?: string; kind?: 'io' | 'svc' | 'ai' | 'data' | 'old' | 'ppl' };
export type DEdge = { from: string; to: string; both?: boolean; dashed?: boolean; dur?: number; label?: string };
export type DiagramSpec = { title: string; nodes: DNode[]; edges: DEdge[] };

export const DIAGRAMS: Record<string, DiagramSpec> = {
  'recruiter-ai': {
    title: 'One live screening call',
    nodes: [
      { id: 'phone', x: 20, y: 171, label: 'Candidate', sub: 'phone call', kind: 'io' },
      { id: 'tel', x: 205, y: 171, label: 'Twilio / Exotel', sub: 'telephony', kind: 'svc' },
      { id: 'ws', x: 390, y: 171, label: 'WebSocket server', sub: 'Python · two-way', kind: 'svc' },
      { id: 'stt', x: 585, y: 56, label: 'Deepgram', sub: 'speech → text', kind: 'ai' },
      { id: 'agent', x: 790, y: 171, label: 'LangChain agent', sub: 'versioned prompts', kind: 'ai' },
      { id: 'tts', x: 585, y: 286, label: 'Sarvam.ai', sub: 'text → speech', kind: 'ai' },
      { id: 'db', x: 790, y: 322, label: 'PostgreSQL', sub: 'evaluations', kind: 'data' },
    ],
    edges: [
      { from: 'phone', to: 'tel', both: true, dur: 1.6 },
      { from: 'tel', to: 'ws', both: true, dur: 1.6 },
      { from: 'ws', to: 'stt', dur: 1.4 },
      { from: 'stt', to: 'agent', dur: 1.4 },
      { from: 'agent', to: 'tts', dur: 1.4 },
      { from: 'tts', to: 'ws', dur: 1.4 },
      { from: 'agent', to: 'db', dur: 2.2, dashed: true },
    ],
  },
  'ticket-booking': {
    title: 'From “what’s on Friday?” to a booked seat',
    nodes: [
      { id: 'ui', x: 20, y: 171, label: 'Chat surface', sub: 'TypeScript', kind: 'io' },
      { id: 'api', x: 205, y: 171, label: 'Django API', sub: 'backend', kind: 'svc' },
      { id: 'graph', x: 400, y: 171, label: 'LangGraph', sub: 'multi-agent router', kind: 'ai' },
      { id: 'find', x: 600, y: 60, label: 'Discovery agent', sub: 'what to watch', kind: 'ai' },
      { id: 'book', x: 600, y: 282, label: 'Booking agent', sub: 'books the seats', kind: 'ai' },
      { id: 'tools', x: 790, y: 171, label: 'Tools', sub: 'listings, seats', kind: 'svc' },
      { id: 'state', x: 400, y: 322, label: 'Thread state', sub: 'persisted', kind: 'data' },
    ],
    edges: [
      { from: 'ui', to: 'api', both: true, dur: 1.6 },
      { from: 'api', to: 'graph', both: true, dur: 1.6 },
      { from: 'graph', to: 'find', dur: 1.4 },
      { from: 'graph', to: 'book', dur: 1.4 },
      { from: 'find', to: 'tools', both: true, dur: 1.5 },
      { from: 'book', to: 'tools', both: true, dur: 1.5 },
      { from: 'graph', to: 'state', both: true, dur: 2, dashed: true },
    ],
  },
  checkministry: {
    title: 'A background check, from order to verdict',
    nodes: [
      { id: 'portal', x: 20, y: 171, label: 'HR team', sub: 'Next.js portal', kind: 'io' },
      { id: 'api', x: 205, y: 171, label: 'Nest.js API', sub: 'workflows', kind: 'svc' },
      { id: 'q', x: 400, y: 171, label: 'SQS', sub: 'job queue', kind: 'svc' },
      { id: 'fn', x: 600, y: 50, label: 'Lambda', sub: 'validates docs', kind: 'svc' },
      { id: 's3', x: 790, y: 50, label: 'S3', sub: 'documents', kind: 'data' },
      { id: 'checks', x: 600, y: 171, label: '20+ check types', sub: 'criminal · edu · ID…', kind: 'ai' },
      { id: 'rds', x: 600, y: 300, label: 'RDS · PostgreSQL', sub: 'live case status', kind: 'data' },
    ],
    edges: [
      { from: 'portal', to: 'api', both: true, dur: 1.6 },
      { from: 'api', to: 'q', dur: 1.4 },
      { from: 'q', to: 'fn', dur: 1.4 },
      { from: 'fn', to: 's3', both: true, dur: 1.4 },
      { from: 'q', to: 'checks', dur: 1.6 },
      { from: 'checks', to: 'rds', dur: 1.6 },
      { from: 'rds', to: 'api', dur: 2.2, dashed: true },
    ],
  },
  avendus: {
    title: 'Portfolios in, reports a family can read',
    nodes: [
      { id: 'src', x: 20, y: 171, label: 'Portfolio data', sub: 'public + private', kind: 'data' },
      { id: 'svc', x: 205, y: 171, label: 'Node.js services', sub: 'TypeScript', kind: 'svc' },
      { id: 'eng', x: 395, y: 171, label: 'Report engine', sub: 'by asset class', kind: 'svc' },
      { id: 'ppt', x: 595, y: 100, label: 'PPT export', kind: 'io' },
      { id: 'pdf', x: 595, y: 242, label: 'PDF export', kind: 'io' },
      { id: 'ui', x: 205, y: 20, label: 'Analytics app', sub: 'React · advisors', kind: 'io' },
      { id: 'fam', x: 790, y: 242, label: 'Client families', sub: 'UHNW · HNW', kind: 'ppl' },
    ],
    edges: [
      { from: 'src', to: 'svc', dur: 1.5 },
      { from: 'svc', to: 'eng', dur: 1.5 },
      { from: 'eng', to: 'ppt', dur: 1.4 },
      { from: 'eng', to: 'pdf', dur: 1.4 },
      { from: 'svc', to: 'ui', dur: 1.8 },
      { from: 'ppt', to: 'fam', dur: 1.6 },
      { from: 'pdf', to: 'fam', dur: 1.6 },
    ],
  },
  districtd: {
    title: 'The rewrite, in one picture',
    nodes: [
      { id: 'old', x: 205, y: 40, label: 'Legacy platform', sub: 'retired', kind: 'old' },
      { id: 'user', x: 20, y: 200, label: 'Visitors', sub: 'faster pages', kind: 'io' },
      { id: 'fe', x: 205, y: 200, label: 'React + TypeScript', sub: 'new frontend', kind: 'svc' },
      { id: 'api', x: 405, y: 200, label: 'Node.js API', kind: 'svc' },
      { id: 'pg', x: 605, y: 200, label: 'PostgreSQL', kind: 'data' },
      { id: 'an', x: 405, y: 322, label: 'Analytics surface', sub: 'rebuilt', kind: 'io' },
    ],
    edges: [
      { from: 'old', to: 'fe', dashed: true, dur: 2.4, label: 'migrated' },
      { from: 'user', to: 'fe', both: true, dur: 1.2 },
      { from: 'fe', to: 'api', both: true, dur: 1.4 },
      { from: 'api', to: 'pg', both: true, dur: 1.4 },
      { from: 'api', to: 'an', dur: 1.6 },
    ],
  },
  rnd: {
    title: 'Where the performance budget went',
    nodes: [
      { id: 'req', x: 20, y: 171, label: 'Requests', kind: 'io' },
      { id: 'main', x: 205, y: 171, label: 'Main thread', sub: 'stays free', kind: 'svc' },
      { id: 'w1', x: 405, y: 60, label: 'Worker 1', sub: 'CPU-bound job', kind: 'svc' },
      { id: 'w2', x: 405, y: 171, label: 'Worker 2', kind: 'svc' },
      { id: 'w3', x: 405, y: 282, label: 'Worker 3', kind: 'svc' },
      { id: 'rn', x: 620, y: 110, label: 'React Native', sub: 'render paths', kind: 'io' },
      { id: 'doc', x: 790, y: 232, label: 'Team guidelines', sub: 'written findings', kind: 'data' },
    ],
    edges: [
      { from: 'req', to: 'main', dur: 1.2 },
      { from: 'main', to: 'w1', both: true, dur: 1.6 },
      { from: 'main', to: 'w2', both: true, dur: 1.9 },
      { from: 'main', to: 'w3', both: true, dur: 2.2 },
      { from: 'w2', to: 'doc', dashed: true, dur: 2.4 },
      { from: 'rn', to: 'doc', dashed: true, dur: 2.4 },
    ],
  },
  proprofs: {
    title: 'A question, asked inside a course',
    nodes: [
      { id: 'tm', x: 205, y: 20, label: 'Training Maker', sub: 'same sign-in', kind: 'ppl' },
      { id: 'user', x: 20, y: 171, label: 'Learners', sub: '+ instructors', kind: 'io' },
      { id: 'app', x: 205, y: 171, label: 'Collaborate', sub: 'responsive · React', kind: 'svc' },
      { id: 'api', x: 400, y: 171, label: 'Node.js API', sub: 'threads, groups, DMs', kind: 'svc' },
      { id: 'db', x: 595, y: 171, label: 'MySQL', kind: 'data' },
      { id: 'out', x: 400, y: 322, label: 'Answered', sub: 'peer or instructor', kind: 'io' },
    ],
    edges: [
      { from: 'tm', to: 'app', dashed: true, dur: 2.2, label: 'no new login' },
      { from: 'user', to: 'app', both: true, dur: 1.2 },
      { from: 'app', to: 'api', both: true, dur: 1.4 },
      { from: 'api', to: 'db', both: true, dur: 1.4 },
      { from: 'api', to: 'out', dur: 1.8 },
    ],
  },
};
