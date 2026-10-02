// Hermes config — mirrors hermes/config.py, read from the Next app env.

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? '';
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? '';
export const WRITER_MODEL = process.env.WRITER_MODEL ?? 'moonshotai/kimi-k2.6:free';
export const FALLBACK_MODELS = (
  process.env.FALLBACK_MODELS ??
  'openai/gpt-oss-120b:free,openai/gpt-oss-20b:free,meta-llama/llama-3.3-70b-instruct:free'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);
export const MODEL_RETRIES = Number(process.env.MODEL_RETRIES ?? '3');

export const TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? '';

export const MAX_TOPICS = Number(process.env.MAX_TOPICS ?? '8');
export const MAX_SOURCES_PER_TOPIC = Number(process.env.MAX_SOURCES_PER_TOPIC ?? '4');

// Telegram — notifications only.
export const HERMES_TG_BOT_TOKEN = process.env.HERMES_TG_BOT_TOKEN ?? '';
export const HERMES_TG_CHAT_ID = process.env.HERMES_TG_CHAT_ID ?? '';

export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_ORIGIN ?? 'https://nandankumar.com';
export const BLOG_ORIGIN = process.env.NEXT_PUBLIC_BLOG_ORIGIN ?? 'https://blog.nandankumar.com';
