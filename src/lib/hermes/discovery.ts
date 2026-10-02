// Discovery — mirrors hermes/discovery.py. Finds role-relevant topics from
// Hacker News (community-validated) + Tavily (broader craft/career angle),
// interleaved so the list is never only hardcore tech.

import { MAX_TOPICS, TAVILY_API_KEY } from './config';
import type { DiscoveredTopic } from './types';

const HN_API = 'https://hacker-news.firebaseio.com/v0';

const TECHNICAL_QUERIES = [
  'LLM agents orchestration patterns lessons',
  'building voice AI agents real-time latency',
  'RAG vector database production tradeoffs',
  'full-stack TypeScript Node React architecture 2026',
  'shipping AI features to production pitfalls',
  'multi-agent systems design in practice',
];
const CRAFT_QUERIES = [
  "how AI is changing the software engineer's job essay",
  'engineering leadership in the age of AI',
  'what makes a good senior engineer now',
  'lessons from building AI products opinion',
  'technical hiring and interviews in the AI era',
  'managing a small engineering team well',
  'developer experience AI coding assistants reflection',
  'career advice for engineers building with AI',
];

const HN_KEYWORDS = new Set([
  // Core tech
  'ai', 'llm', 'ml', 'gpt', 'claude', 'gemini', 'model', 'agent', 'vector',
  'embedding', 'inference', 'transformer', 'rag', 'fine-tun', 'diffusion',
  'engineering', 'platform', 'system', 'backend', 'frontend', 'api',
  'architecture', 'scale', 'distributed', 'kubernetes', 'docker', 'deploy',
  'performance', 'latency', 'rust', 'golang', 'typescript', 'python',
  'open source', 'framework', 'library', 'tool', 'database', 'postgres',
  'microservice', 'serverless', 'edge', 'realtime', 'voice', 'speech',
  // Craft, leadership, career, product
  'developer', 'engineer', 'career', 'hiring', 'interview', 'team',
  'leadership', 'management', 'manager', 'productivity', 'startup',
  'founder', 'product', 'remote', 'burnout', 'mentorship', 'craft',
  'writing', 'learning', 'saas', 'fintech',
]);

function rotating(pool: string[], n: number): string[] {
  if (!pool.length) return [];
  const ordinal = Math.floor(Date.now() / 86_400_000); // days since epoch
  const offset = ordinal % pool.length;
  return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, n);
}

function todaysQueries(): string[] {
  return [...rotating(TECHNICAL_QUERIES, 3), ...rotating(CRAFT_QUERIES, 3)];
}

interface HnItem {
  type?: string;
  title?: string;
  text?: string;
  url?: string;
  score?: number;
}

async function fetchHnStories(limit = 20): Promise<DiscoveredTopic[]> {
  let ids: number[] = [];
  try {
    const resp = await fetch(`${HN_API}/topstories.json`, { signal: AbortSignal.timeout(10_000) });
    if (!resp.ok) return [];
    ids = ((await resp.json()) as number[]).slice(0, 60);
  } catch {
    return [];
  }

  const items = await Promise.all(
    ids.map(async (id): Promise<HnItem | null> => {
      try {
        const r = await fetch(`${HN_API}/item/${id}.json`, { signal: AbortSignal.timeout(8_000) });
        return r.ok ? ((await r.json()) as HnItem) : null;
      } catch {
        return null;
      }
    })
  );

  const relevant: DiscoveredTopic[] = [];
  for (const item of items) {
    if (!item || item.type !== 'story' || !item.url || (item.score ?? 0) <= 20) continue;
    const text = `${item.title ?? ''} ${item.text ?? ''}`.toLowerCase();
    if ([...HN_KEYWORDS].some((kw) => text.includes(kw))) {
      relevant.push({
        title: item.title ?? '',
        url: item.url,
        score: item.score ?? 0,
        source: 'hn',
      });
    }
  }
  relevant.sort((a, b) => b.score - a.score);
  return relevant.slice(0, limit);
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
}

async function searchTavily(queries: string[]): Promise<DiscoveredTopic[]> {
  if (!TAVILY_API_KEY) return [];
  const topics: DiscoveredTopic[] = [];
  for (const query of queries) {
    try {
      const resp = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          max_results: 4,
          days: 7,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!resp.ok) continue;
      const data = (await resp.json()) as { results?: TavilyResult[] };
      for (const r of data.results ?? []) {
        if (!r.url) continue;
        topics.push({
          title: r.title ?? '',
          url: r.url,
          score: Math.round((r.score ?? 0) * 100),
          source: 'tavily',
          snippet: (r.content ?? '').slice(0, 400),
        });
      }
    } catch {
      // skip a failed query
    }
  }
  return topics;
}

/** Discover today's candidate topics, deduped and interleaved (HN ↔ Tavily). */
export async function discoverTopics(): Promise<DiscoveredTopic[]> {
  const [hn, tavily] = await Promise.all([fetchHnStories(), searchTavily(todaysQueries())]);

  const seen = new Set<string>();
  const hnUnique: DiscoveredTopic[] = [];
  const tavilyUnique: DiscoveredTopic[] = [];
  for (const t of [...hn, ...tavily]) {
    const norm = t.url.replace(/\/+$/, '').toLowerCase();
    if (seen.has(norm)) continue;
    seen.add(norm);
    (t.source === 'hn' ? hnUnique : tavilyUnique).push(t);
  }
  hnUnique.sort((a, b) => b.score - a.score);
  tavilyUnique.sort((a, b) => b.score - a.score);

  // Interleave so both community tech and broader craft angles always appear.
  const result: DiscoveredTopic[] = [];
  let i = 0;
  let j = 0;
  while (result.length < MAX_TOPICS && (i < hnUnique.length || j < tavilyUnique.length)) {
    if (i < hnUnique.length) result.push(hnUnique[i++]);
    if (result.length >= MAX_TOPICS) break;
    if (j < tavilyUnique.length) result.push(tavilyUnique[j++]);
  }
  return result;
}
