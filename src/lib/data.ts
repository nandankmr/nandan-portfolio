export const SITE = {
  name: 'NANDAN KUMAR',
  role: 'Senior Full-stack & AI Engineer',
  company: 'Crownstack Technologies',
  location: 'Bengaluru, IN',
  timezone: 'GMT+5:30',
  email: 'nandankmrjha@gmail.com',
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
    { label: 'Write-up', href: '#' },
  ],
};

export const ACCENT_OPTIONS = ['#ff5b2e', '#2563eb', '#a855f7'] as const;
export const THEME_IDS = ['minimal', 'terminal', 'bold'] as const;
export type Theme = (typeof THEME_IDS)[number];
export type Accent = (typeof ACCENT_OPTIONS)[number];
