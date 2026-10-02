// Background job runner. Routes kick a job off without awaiting; the work
// continues on the long-lived Node process and updates the hermes_jobs row.
// The Studio UI polls job status.

import crypto from 'crypto';
import { createPost, getPostById, updateDraftPost } from '@/lib/blog';
import { BLOG_ORIGIN, SITE_ORIGIN } from './config';
import {
  createJob,
  getTopic,
  setTopicStatus,
  updateJob,
  upsertDiscoveredTopics,
} from './db';
import { discoverTopics } from './discovery';
import { notifyDraftFailed, notifyDraftReady, notifyTopicsReady } from './notify';
import { researchTopic } from './research';
import { revisePost, writePost } from './writer';
import type { HermesJob } from './types';

function previewUrl(id: string, token: string): string {
  return `${BLOG_ORIGIN}/preview/${id}?token=${token}`;
}

/** Create a draft post, retrying once with a unique-slug suffix on collision. */
async function createDraftWithUniqueSlug(input: Parameters<typeof createPost>[0]) {
  try {
    return await createPost(input);
  } catch (e) {
    if (/duplicate|unique/i.test((e as Error).message)) {
      const suffix = crypto.randomBytes(2).toString('hex');
      return createPost({ ...input, slug: `${input.slug}-${suffix}` });
    }
    throw e;
  }
}

// ── Runners (the actual async work) ───────────────────────────────────

async function runDiscover(jobId: string): Promise<void> {
  try {
    await updateJob(jobId, { status: 'running', stage: 'Scanning sources…' });
    const topics = await discoverTopics();
    const inserted = await upsertDiscoveredTopics(topics);
    await updateJob(jobId, { status: 'done', stage: `${inserted} new` });
    notifyTopicsReady(inserted, `${SITE_ORIGIN}/admin/studio`);
  } catch (e) {
    await updateJob(jobId, { status: 'error', error: (e as Error).message });
  }
}

async function runDraft(jobId: string, topicId: string): Promise<void> {
  let topicTitle = '';
  try {
    const topic = await getTopic(topicId);
    if (!topic) throw new Error('Topic not found');
    topicTitle = topic.title;

    await setTopicStatus(topicId, 'drafting');
    await updateJob(jobId, { status: 'running', stage: 'Researching…' });
    const brief = await researchTopic({ title: topic.title, url: topic.url });

    await updateJob(jobId, { stage: 'Writing…' });
    const draft = await writePost(brief);

    await updateJob(jobId, { stage: 'Saving draft…' });
    const post = await createDraftWithUniqueSlug({
      slug: draft.slug,
      title: draft.title,
      description: draft.description,
      dek: draft.dek,
      category: draft.category,
      tags: draft.tags,
      date: draft.date,
      reading_time: draft.readingTime,
      toc: draft.toc,
      content: draft.content,
      authored_by: 'hermes',
    });

    await setTopicStatus(topicId, 'drafted', post.id);
    await updateJob(jobId, { status: 'done', stage: 'Draft ready', draftPostId: post.id });
    notifyDraftReady(draft.title, previewUrl(post.id, post.preview_token ?? ''));
  } catch (e) {
    const msg = (e as Error).message;
    await updateJob(jobId, { status: 'error', error: msg });
    // Release the topic so it can be retried.
    await setTopicStatus(topicId, 'candidate').catch(() => {});
    notifyDraftFailed(topicTitle || 'topic', msg);
  }
}

async function runRevise(jobId: string, draftPostId: string, notes: string): Promise<void> {
  try {
    const current = await getPostById(draftPostId);
    if (!current) throw new Error('Draft not found');
    if (current.status !== 'draft') throw new Error('Only drafts can be revised');

    await updateJob(jobId, { status: 'running', stage: 'Revising…' });
    const revised = await revisePost(
      {
        slug: current.slug,
        title: current.title,
        dek: current.dek ?? undefined,
        description: current.description,
        category: current.category,
        tags: current.tags,
        content: current.content,
      },
      notes
    );

    await updateDraftPost(draftPostId, {
      title: revised.title,
      description: revised.description,
      dek: revised.dek,
      category: revised.category,
      tags: revised.tags,
      reading_time: revised.readingTime,
      toc: revised.toc,
      content: revised.content,
    });
    await updateJob(jobId, { status: 'done', stage: 'Revised', draftPostId });
  } catch (e) {
    await updateJob(jobId, { status: 'error', error: (e as Error).message });
  }
}

// ── Public starters (fire-and-forget) ─────────────────────────────────

export async function startDiscoverJob(): Promise<HermesJob> {
  const job = await createJob('discover');
  void runDiscover(job.id);
  return job;
}

export async function startDraftJob(topicId: string): Promise<HermesJob> {
  const job = await createJob('draft', { topicId });
  void runDraft(job.id, topicId);
  return job;
}

export async function startReviseJob(draftPostId: string, notes: string): Promise<HermesJob> {
  const job = await createJob('revise', { draftPostId });
  void runRevise(job.id, draftPostId, notes);
  return job;
}
