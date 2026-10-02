import { FEATURED, PROJECTS } from '@/lib/data';

// The work index and the case-study pages share this list.
export type Kind = 'AI' | 'Fintech' | 'SaaS' | 'EdTech';
export type Project = {
  id: string;
  year: string;
  name: string;
  tag: string;
  summary: string;
  bullets?: string[];
  stack: string[];
  links: { label: string; href: string }[];
  kind: Kind;
  reading?: { title: string; slug: string }[];
  setting?: Setting;
  job: string; // EXPERIENCE.company this was built at
  // Real, publishable outcomes only. Renders a "Results" block when present, e.g.
  // results: [{ value: '40%', label: 'faster page loads' }]
  results?: { value: string; label: string }[];
};

// Public facts about the company and product, with a source to check them against.
export type Setting = { company: string; about: string; source: { label: string; href: string }[] };

const CROWNSTACK: Setting = {
  company: 'Crownstack Technologies',
  about: 'A Noida product-engineering firm, founded in 2017, that builds software for clients in healthcare, logistics and retail. Its generative-AI practice adds LLM features and workflow agents to existing products. That is where these agents were built.',
  source: [{ label: 'crownstack.com', href: 'https://crownstack.com' }],
};
const DISTRICTD: Setting = {
  company: 'DistrictD',
  about: 'A bootstrapped Noida fintech, founded in 2016, that builds research, portfolio-analysis and automated client-reporting tools for wealth and asset managers. Its clients include Avendus.',
  source: [{ label: 'districtd.co.in', href: 'https://districtd.co.in/about-us' }],
};

const SETTING: Record<string, Setting> = {
  'recruiter-ai': CROWNSTACK,
  'ticket-booking': CROWNSTACK,
  checkministry: {
    company: 'CheckMinistry',
    about: 'An ISO 27001-certified background-screening SaaS company headquartered in Hong Kong. It offers 20+ check types (criminal, education, employment, identity, sanctions) to 300+ clients across regulated industries, and returns most checks in about 72 hours.',
    source: [{ label: 'checkministry.com', href: 'https://checkministry.com' }],
  },
  avendus: {
    company: 'DistrictD × Avendus Wealth',
    about: 'Built at DistrictD for Avendus Wealth Management, which advises more than 1,000 ultra-high- and high-net-worth families. Reporting is how those families see their portfolios across public and private markets.',
    source: [{ label: 'districtd.co.in', href: 'https://districtd.co.in/about-us' }, { label: 'avendus.com', href: 'https://avendus.com' }],
  },
  districtd: DISTRICTD,
  rnd: DISTRICTD,
  proprofs: {
    company: 'ProProfs',
    about: 'ProProfs makes SaaS for training and customer support (Training Maker, Quiz Maker, Knowledge Base and more), used by millions of people in 150+ countries. Collaborate is the discussion space inside Training Maker: learners and instructors ask questions, form groups and message each other, with no separate login.',
    source: [{ label: 'proprofs.com', href: 'https://www.proprofs.com' }, { label: 'Collaborate', href: 'https://www.proprofstraining.com/integrations/collaborate/' }],
  },
};

const JOB: Record<string, string> = {
  'recruiter-ai': 'Crownstack Technologies', 'ticket-booking': 'Crownstack Technologies', checkministry: 'CheckMinistry',
  avendus: 'DistrictD', districtd: 'DistrictD', rnd: 'DistrictD', proprofs: 'ProProfs',
};

const KIND: Record<string, Kind> = {
  'ticket-booking': 'AI', checkministry: 'SaaS', avendus: 'Fintech', districtd: 'Fintech', rnd: 'Fintech', proprofs: 'EdTech',
};

export const WORK: Project[] = [
  {
    id: FEATURED.id, year: FEATURED.year, name: FEATURED.name, tag: FEATURED.tag, summary: FEATURED.summary,
    bullets: FEATURED.bullets, stack: FEATURED.stack, links: FEATURED.links, kind: 'AI' as Kind,
    reading: [
      { title: 'Building RecruiteAI: the voice agent that learned to interview.', slug: 'building-recruiteai-voice-agent' },
      { title: 'Sub-second turn latency on a phone call.', slug: 'sub-second-turn-latency' },
    ],
  },
  ...PROJECTS.map((p) => ({ id: p.id, year: p.year, name: p.name, tag: p.tag, summary: p.desc, stack: p.stack, links: p.links, kind: KIND[p.id] })),
].map((p) => ({ ...p, links: p.links.filter((l) => l.href !== '#'), setting: SETTING[p.id], job: JOB[p.id] }));
