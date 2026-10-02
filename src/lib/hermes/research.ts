// Research — mirrors hermes/research.py. Builds a citable brief for a topic:
// the main article (extracted), Tavily advanced search (answer + quality
// sources), and a list of concrete fact-bearing sentences for the writer.

import { extract } from '@extractus/article-extractor';
import { MAX_SOURCES_PER_TOPIC, TAVILY_API_KEY } from './config';

const JUNK_DOMAINS = new Set([
  'facebook.com', 'instagram.com', 'threads.net', 'tiktok.com',
  'twitter.com', 'x.com', 't.co', 'reddit.com', 'redd.it',
  'youtube.com', 'youtu.be', 'pinterest.com', 'quora.com',
  'linkedin.com', 'medium.com',
]);

function domain(url: string): string {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return '';
  }
}

function isQualitySource(url: string): boolean {
  const host = domain(url);
  if (!host) return false;
  return ![...JUNK_DOMAINS].some((d) => host === d || host.endsWith(`.${d}`));
}

export interface Source {
  url: string;
  title: string;
  content: string;
}

export interface ResearchBrief {
  topic: { title: string; url: string };
  sources: Source[];
  tavilyAnswer: string;
  keyFacts: string[];
}

function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchArticle(url: string, maxChars = 8000): Promise<string> {
  try {
    const article = await extract(url);
    const text = article?.content ? htmlToText(article.content) : '';
    return text.slice(0, maxChars);
  } catch {
    return '';
  }
}

async function tavilyDeep(query: string): Promise<{ answer: string; sources: Source[] }> {
  if (!TAVILY_API_KEY) return { answer: '', sources: [] };
  try {
    const resp = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query,
        search_depth: 'advanced',
        max_results: MAX_SOURCES_PER_TOPIC + 4, // over-fetch for junk filtering
        include_answer: true,
        exclude_domains: [...JUNK_DOMAINS],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return { answer: '', sources: [] };
    const data = (await resp.json()) as {
      answer?: string;
      results?: { url?: string; title?: string; content?: string }[];
    };
    const sources: Source[] = (data.results ?? [])
      .filter((r) => r.url && isQualitySource(r.url))
      .map((r) => ({ url: r.url!, title: r.title ?? '', content: (r.content ?? '').slice(0, 4000) }));
    return { answer: data.answer ?? '', sources };
  } catch {
    return { answer: '', sources: [] };
  }
}

// Signals that a sentence carries a concrete, citable fact (mirrors research.py).
const FACT_TOKENS =
  /(\d+\.?\d*\s?%|\$\s?\d|\d+\.?\d*\s?[×x]\b|\bbenchmark|\bscore[ds]?\b|\btokens?\b|\bfaster\b|\bcheaper\b|\bSWE-?bench|\bMMLU|\bGPQA|\brelease[ds]?\b|\blaunch(?:ed|es)?\b|\bversion\b|\bper million\b|\b\d{4}\b|\b\d+\s?(?:million|billion|k|M|B)\b)/i;

function extractFacts(sources: Source[], limit = 18): string[] {
  const facts: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    for (const raw of src.content.split(/(?<=[.!?])\s+|\n+/)) {
      const s = raw.trim();
      if (s.length < 40 || s.length > 280) continue;
      if (!FACT_TOKENS.test(s)) continue;
      if (!/\d/.test(s)) continue;
      const key = s.toLowerCase().replace(/\s+/g, ' ');
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push(s);
      if (facts.length >= limit) return facts;
    }
  }
  return facts;
}

export async function researchTopic(topic: { title: string; url: string }): Promise<ResearchBrief> {
  // 1. Main article
  const mainText = topic.url ? await fetchArticle(topic.url) : '';

  // 2. Deep Tavily search
  const { answer: tavilyAnswer, sources: relatedSources } = await tavilyDeep(
    `${topic.title} technical implementation details analysis`
  );

  // 3. Enrich thin related sources with full text
  await Promise.all(
    relatedSources.slice(0, 3).map(async (src) => {
      if (src.content.length < 500 && src.url !== topic.url) {
        const full = await fetchArticle(src.url, 5000);
        if (full) src.content = full;
      }
    })
  );

  // 4. Assemble (main first), dropping junk + duplicates
  const sources: Source[] = [];
  if (mainText) sources.push({ url: topic.url, title: topic.title, content: mainText });
  for (const src of relatedSources) {
    if (src.url === topic.url || !isQualitySource(src.url)) continue;
    sources.push(src);
  }
  const trimmed = sources.slice(0, MAX_SOURCES_PER_TOPIC);

  // 5. Mine concrete facts
  const keyFacts = extractFacts(trimmed);

  return { topic: { title: topic.title, url: topic.url }, sources: trimmed, tavilyAnswer, keyFacts };
}
