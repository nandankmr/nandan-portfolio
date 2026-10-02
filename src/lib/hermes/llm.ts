// LLM provider — mirrors hermes/writer.py `_generate`.
// OpenAI direct is the primary (paid, high quality) when a key is set; otherwise
// — or if OpenAI fails — fall through the OpenRouter free-model chain.

import {
  FALLBACK_MODELS,
  MODEL_RETRIES,
  OPENAI_API_KEY,
  OPENAI_MODEL,
  OPENROUTER_API_KEY,
  WRITER_MODEL,
} from './config';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TIMEOUT_MS = 120_000;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  return fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

function extractContent(data: unknown): string {
  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM response missing choices[0].message.content');
  return content;
}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < MODEL_RETRIES; attempt++) {
    const resp = await postJson(
      OPENAI_URL,
      { authorization: `Bearer ${OPENAI_API_KEY}` },
      { model: OPENAI_MODEL, messages, max_tokens: 4096, temperature: 0.7 }
    );
    if ([429, 500, 502, 503].includes(resp.status)) {
      lastError = new Error(`OpenAI ${OPENAI_MODEL}: HTTP ${resp.status}`);
      await sleep(2 ** attempt * 1000);
      continue;
    }
    if (!resp.ok) throw new Error(`OpenAI ${OPENAI_MODEL}: HTTP ${resp.status} ${await resp.text()}`);
    return extractContent(await resp.json());
  }
  throw lastError ?? new Error('OpenAI call failed');
}

async function callOpenRouter(messages: ChatMessage[]): Promise<string> {
  const headers = {
    authorization: `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': 'https://nandankumar.com',
    'X-Title': 'Hermes Blog Agent',
  };
  // Primary first, then the rest of the chain (deduped).
  const chain = [WRITER_MODEL, ...FALLBACK_MODELS.filter((m) => m !== WRITER_MODEL)];

  let lastError: Error | null = null;
  for (const model of chain) {
    for (let attempt = 0; attempt < MODEL_RETRIES; attempt++) {
      try {
        const resp = await postJson(OPENROUTER_URL, headers, {
          model,
          messages,
          max_tokens: 4096,
          temperature: 0.7,
        });
        if (resp.status === 429) {
          lastError = new Error(`${model}: 429 (overloaded)`);
          await sleep(2 ** attempt * 1000); // 1s, 2s, 4s back-off
          continue;
        }
        if (!resp.ok) {
          // Non-429 HTTP errors (402/404/etc.): skip to the next model immediately.
          lastError = new Error(`${model}: HTTP ${resp.status}`);
          break;
        }
        return extractContent(await resp.json());
      } catch (e) {
        lastError = e as Error;
      }
    }
  }
  throw lastError ?? new Error('OpenRouter chain exhausted');
}

/** Generate a completion. OpenAI primary (if configured), OpenRouter fallback. */
export async function generate(messages: ChatMessage[]): Promise<string> {
  if (OPENAI_API_KEY) {
    try {
      return await callOpenAI(messages);
    } catch (e) {
      console.warn(`[hermes/llm] OpenAI failed (${(e as Error).message}); falling back to OpenRouter`);
    }
  }
  return callOpenRouter(messages);
}
