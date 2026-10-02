import { postUrl } from '@/lib/blog/urls';

export const SITE = {
  name: 'NANDAN KUMAR',
  role: 'Senior Full-stack & AI Engineer',
  company: 'Crownstack Technologies',
  timezone: 'GMT+5:30',
  email: 'contact@nandankumar.com',
  phone: '+91 79032 29509',
  github: 'github.com/nandankmr',
  linkedin: 'linkedin.com/in/nandan-kumar-a411ba105',
  resume: '/Nandan_Kumar_Resume.pdf',
};

export const EXPERIENCE = [
  {
    company: 'Crownstack Technologies',
    role: 'AI Engineer',
    period: 'Dec 2025 — Present',
    location: 'Noida, Sector-3',
    kind: 'AI · Agentic systems',
    about: 'Product-engineering firm (est. 2017) with a generative-AI practice: LLM features and workflow agents for clients.',
    points: [
      'Designing and shipping production-grade agentic-AI products end-to-end — voice agents, conversational booking flows, and the supporting infrastructure that holds them together.',
      'Built Recruiter AI: a voice agent that places live phone screens over Twilio + Exotel, transcribes in real time with Deepgram, and produces structured, recruiter-ready evaluations via LangChain.',
      'Architected a conversational ticket-booking agent on LangGraph — multi-agent orchestration with persistent thread state, a Django backend, and a TypeScript chat surface.',
      'Establishing the AI engineering playbook for the studio: prompt versioning in git, structured outputs by default, eval harnesses, and a small library of reusable agent components.',
    ],
    stack: ['Python', 'LangChain', 'LangGraph', 'Django', 'React', 'Twilio', 'Deepgram', 'PostgreSQL'],
  },
  {
    company: 'CheckMinistry',
    role: 'Senior Software Engineer',
    period: 'Feb 2025 — Dec 2025',
    location: 'Okhla Phase III, Delhi',
    kind: 'SaaS · Background verification',
    about: 'ISO 27001-certified screening SaaS: 20+ check types for 300+ clients, most returned in about 72 hours.',
    points: [
      'Shipped the core of CheckMinistry\'s enterprise BGV platform — automated workflows, document validation, and real-time status tracking.',
      'Led the team to deliver scalable, secure features against tight compliance deadlines.',
      'Designed AWS infrastructure end-to-end — EC2, S3, RDS, Lambda, SQS — and the CI/CD pipelines that ship to it.',
    ],
    stack: ['Node.js', 'TypeScript', 'React.js', 'PostgreSQL', 'AWS'],
  },
  {
    company: 'DistrictD',
    role: 'Senior Software Engineer',
    period: 'Nov 2021 — Jan 2025',
    location: 'Noida, Sector-2',
    kind: 'Fintech · Wealth management',
    about: 'Bootstrapped fintech (est. 2016) building research, portfolio analysis and client reporting for wealth managers.',
    points: [
      'Led a ground-up rewrite of the platform on a modern stack — cut page-load times and unblocked the analytics roadmap.',
      'Owned Avendus Wealth end-to-end — an analytics + PPT/PDF reporting platform — plus one other major release.',
      'Managed a team of 6 engineers and collaborated cross-functionally on key initiatives.',
      'Ran R&D on React Native rendering and Node.js worker threads; rolled findings into team performance guidelines.',
    ],
    stack: ['React.js', 'TypeScript', 'Node.js', 'React Native', 'PostgreSQL'],
  },
  {
    company: 'ProProfs',
    role: 'Web Developer',
    period: 'Mar 2020 — Nov 2021',
    location: 'Noida, NSEZ',
    kind: 'EdTech · SaaS',
    about: 'Training and support SaaS (Training Maker, Quiz Maker, Knowledge Base) used in 150+ countries.',
    points: [
      'Built and maintained responsive web applications for an educational-technology platform.',
      'Shipped customer-facing features across the core product.',
      'Partnered with design and product on full-stack feature delivery.',
    ],
    stack: ['React', 'Node.js', 'MySQL', 'HTML / CSS'],
  },
];

export const PROJECTS = [
  {
    id: 'ticket-booking',
    year: '2025',
    name: 'Conversational Ticket Booking Agent',
    tag: 'Crownstack · Agentic',
    desc: 'Chat-driven AI agent that discovers what you want to watch and books it without leaving the conversation. Multi-agent LangGraph orchestration with persistent thread state and a Django backend.',
    stack: ['Django', 'LangGraph', 'OpenAI', 'TypeScript'],
    links: [
      { label: 'Live demo', href: 'https://ai.quicklabs.in/ai-agents/ticket-booking-agent' },
      { label: 'GitHub', href: 'https://github.com/nandankmr/EventAI' },
    ],
  },
  {
    id: 'checkministry',
    year: '2025',
    name: 'CheckMinistry',
    tag: 'SaaS · BGV platform',
    desc: 'Enterprise background-verification platform with automated workflows, document validation, and real-time status tracking. Led the team and architected AWS infrastructure end-to-end.',
    stack: ['Next.js', 'Nest.js', 'AWS', 'PostgreSQL'],
    links: [{ label: 'Case study', href: '#' }],
  },
  {
    id: 'avendus',
    year: '2024',
    name: 'Avendus Wealth',
    tag: 'DistrictD · Fintech reports',
    desc: 'Analytics platform generating detailed investment reports in PPT/PDF, segmented by asset class, category, and performance. Led the team from zero to production.',
    stack: ['React', 'TypeScript', 'Node.js', 'CI/CD'],
    links: [{ label: 'Case study', href: '#' }],
  },
  {
    id: 'districtd',
    year: '2023',
    name: 'DistrictD overhaul',
    tag: 'Fintech · platform rewrite',
    desc: 'Complete website overhaul for a wealth-management firm. Led the migration to modern web tech and rebuilt the analytics surface for performance at scale.',
    stack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    links: [{ label: 'Case study', href: '#' }],
  },
  {
    id: 'rnd',
    year: '2022',
    name: 'Performance R&D',
    tag: 'Internal · platform',
    desc: 'Hands-on research into Node.js worker threads and React Native rendering paths to find where the studio could spend its perf budget best. Wrote the findings into team guidelines.',
    stack: ['Node.js', 'React Native', 'Profiling'],
    links: [],
  },
  {
    id: 'proprofs',
    year: '2021',
    name: 'ProProfs Collaborate',
    tag: 'EdTech · web app',
    desc: "Built and maintained responsive web applications for ProProfs' EdTech platform. Shipped feature work that improved usability and engagement across the core product.",
    stack: ['React', 'Node.js', 'MySQL'],
    links: [],
  },
];

export const SKILLS = [
  {
    cat: 'Backend',
    take: 'Node by default. Python when the AI needs it.',
    items: [
      { name: 'Node.js',    years: 6, projects: ['CheckMinistry', 'Avendus Wealth', 'ProProfs'] },
      { name: 'Nest.js',    years: 2, projects: ['CheckMinistry'] },
      { name: 'Express.js', years: 6, projects: ['Avendus Wealth', 'ProProfs'] },
      { name: 'TypeScript', years: 5, projects: ['CheckMinistry', 'DistrictD', 'Avendus Wealth'] },
      { name: 'Python',     years: 1, projects: ['Recruiter AI'] },
      { name: 'Django',     years: 1, projects: ['Ticket Booking Agent'] },
    ],
  },
  {
    cat: 'Frontend',
    take: 'React for everything that needs a screen.',
    items: [
      { name: 'React.js',     years: 6, projects: ['Avendus Wealth', 'CheckMinistry', 'ProProfs', 'DistrictD'] },
      { name: 'Next.js',      years: 3, projects: ['CheckMinistry'] },
      { name: 'React Native', years: 2, projects: ['DistrictD R&D'] },
      { name: 'Tailwind',     years: 3, projects: ['CheckMinistry'] },
      { name: 'Material UI',  years: 3, projects: ['Avendus Wealth'] },
      { name: 'HTML / CSS',   years: 6, projects: ['All projects'] },
    ],
  },
  {
    cat: 'AI & Agents',
    take: 'Structured outputs, evals, and the courage to ship.',
    items: [
      { name: 'LangChain',   years: 1, projects: ['Recruiter AI'] },
      { name: 'LangGraph',   years: 1, projects: ['Ticket Booking Agent'] },
      { name: 'OpenAI',      years: 1, projects: ['Ticket Booking Agent'] },
      { name: 'ChromaDB',    years: 1, projects: ['Internal RAG'] },
      { name: 'Deepgram',    years: 1, projects: ['Recruiter AI'] },
      { name: 'Sarvam.ai',   years: 1, projects: ['Recruiter AI'] },
      { name: 'Twilio',      years: 1, projects: ['Recruiter AI'] },
      { name: 'Claude Code', years: 1, projects: ['Internal tooling'] },
    ],
  },
  {
    cat: 'Data',
    take: 'Postgres for almost everything. Redis when latency matters.',
    items: [
      { name: 'PostgreSQL', years: 5, projects: ['CheckMinistry', 'DistrictD', 'Recruiter AI'] },
      { name: 'MySQL',      years: 3, projects: ['ProProfs'] },
      { name: 'Redis',      years: 3, projects: ['DistrictD'] },
      { name: 'Sequelize',  years: 4, projects: ['DistrictD', 'ProProfs'] },
      { name: 'SQLAlchemy', years: 1, projects: ['Recruiter AI'] },
    ],
  },
  {
    cat: 'Cloud & DevOps',
    take: 'Deep on AWS — comfortable building the pipeline from scratch.',
    items: [
      { name: 'AWS',               years: 3, projects: ['CheckMinistry', 'DistrictD'] },
      { name: 'EC2 · S3 · RDS',    years: 3, projects: ['CheckMinistry'] },
      { name: 'Lambda · SQS',      years: 2, projects: ['CheckMinistry'] },
      { name: 'Elastic Beanstalk', years: 2, projects: ['DistrictD'] },
      { name: 'Docker',            years: 3, projects: ['CheckMinistry'] },
      { name: 'CI/CD',             years: 4, projects: ['Avendus Wealth', 'CheckMinistry'] },
    ],
  },
  {
    cat: 'Tools',
    take: 'AI-native dev workflow; still write the harder code by hand.',
    items: [
      { name: 'Git',      years: 6, projects: ['All projects'] },
      { name: 'Linux',    years: 5, projects: ['Server mgmt'] },
      { name: 'Codex',    years: 1, projects: ['Internal tooling'] },
      { name: 'Windsurf', years: 1, projects: ['Internal tooling'] },
      { name: 'Kiro',     years: 1, projects: ['Internal tooling'] },
    ],
  },
];

export const FEATURED = {
  id: 'recruiter-ai',
  index: '01',
  name: 'Recruiter AI',
  year: '2025',
  tag: 'Agentic · voice',
  role: 'At Crownstack · lead engineer',
  summary:
    'An AI agent that places real phone calls, screens candidates end-to-end, and produces structured evaluations — cutting first-round screening from hours per day to minutes of review.',
  bullets: [
    'Bi-directional WebSocket telephony pipeline over Twilio + Exotel with sub-second turn latency',
    'LangChain agents with versioned prompts and structured-output-only evaluations',
    'Deepgram STT + Sarvam.ai TTS for multilingual real-time voice',
    'Built end-to-end: React frontend, Python backend, Postgres + SQLAlchemy',
  ],
  stack: ['React', 'Python', 'LangChain', 'Twilio', 'Deepgram', 'Sarvam.ai', 'PostgreSQL'],
  links: [
    { label: 'GitHub', href: 'https://github.com/nandankmr/RecruiteAI' },
    { label: 'Write-up', href: postUrl('building-recruiteai-voice-agent') },
  ],
};

// Career as `git log --reverse --graph`. `main` is the day job; `side` is a
// branch of personal projects (dates are when the repo was last pushed on
// github.com/nandankmr). `side: 'open' | 'merge'` forks/joins the side lane.
export type Commit = {
  date: string;
  lane: 'main' | 'side';
  msg: string;
  body?: string;
  tag?: string;
  job?: string; // EXPERIENCE.company — expands to that role's details
  side?: 'open' | 'merge';
  head?: boolean;
};

export const CAREER: Commit[] = [
  { date: 'Dec 2017', lane: 'main', msg: 'init: learning-python', body: 'First public repo. Python basics, one exercise at a time.' },
  { date: 'Mar 2018', lane: 'side', side: 'open', msg: 'feat(c++): N-Language', body: 'C and C++ practice — N-Language, then linked lists in C, by hand.' },
  { date: 'Jun 2018', lane: 'main', msg: 'feat(web): first Django app', body: 'mySite, then a movie database. The web clicked.' },
  { date: 'Mar 2020', lane: 'main', tag: 'v1.0', job: 'ProProfs', msg: 'job(proprofs): web developer' },
  { date: 'Jan 2021', lane: 'side', msg: 'feat: ImageFinder', body: 'One search across Pixabay, Unsplash, Pexels and Giphy, with accounts.' },
  { date: 'Sep 2021', lane: 'side', side: 'merge', msg: 'feat: whisper client + server', body: 'A JavaScript client and server, built as a pair.' },
  { date: 'Nov 2021', lane: 'main', tag: 'v2.0', job: 'DistrictD', msg: 'job(districtd): senior software engineer' },
  { date: '2022', lane: 'main', msg: 'perf: worker threads + React Native R&D', body: 'Findings became the team performance guidelines.' },
  { date: 'May 2023', lane: 'side', side: 'open', msg: 'feat: chirp (T3 stack)', body: 'Next.js + NextAuth on create-t3-app, to learn the stack properly.' },
  { date: '2023', lane: 'main', msg: 'refactor!: platform rewrite', body: 'Ground-up rewrite on a modern stack; page loads came down.' },
  { date: 'Dec 2024', lane: 'side', side: 'merge', msg: 'feat: e-commerce api + web', body: 'Orders end to end — backend and frontend as separate repos.' },
  { date: 'Feb 2025', lane: 'main', tag: 'v3.0', job: 'CheckMinistry', msg: 'job(checkministry): senior software engineer' },
  { date: 'Nov 2025', lane: 'side', side: 'open', msg: 'feat: pulse', body: 'Realtime chat in React Native + Socket.io — groups, attachments, unread badges.' },
  { date: 'Dec 2025', lane: 'main', tag: 'v4.0', job: 'Crownstack Technologies', msg: 'job(crownstack): ai engineer' },
  { date: 'May 2026', lane: 'side', side: 'merge', msg: 'feat: quick-survey + this site', body: 'Open-source multi-tenant Rails 8 surveys; this portfolio, its blog and Hermes, the agent that drafts posts.' },
  { date: 'now', lane: 'main', head: true, msg: 'HEAD → open to senior / staff IC roles', body: 'Remote-first preferred. GMT+5:30.' },
];

export const ACCENT_OPTIONS = ['#ff5b2e', '#2563eb', '#a855f7'] as const;
export const THEME_IDS = ['minimal', 'terminal', 'bold'] as const;
export type Theme = (typeof THEME_IDS)[number];
export type Accent = (typeof ACCENT_OPTIONS)[number];
