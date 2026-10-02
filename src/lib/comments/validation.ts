import { maxUrlsAllowed, usesReservedAuthorName } from './settings';

export interface CommentValidationInput {
  authorName?: unknown;
  authorEmail?: unknown;
  body?: unknown;
  website?: unknown;
  parentId?: unknown;
  isAuthor?: boolean;
}

export function validateCommentInput(input: CommentValidationInput) {
  const authorName = String(input.authorName ?? '').trim();
  const authorEmail = String(input.authorEmail ?? '').trim();
  const body = String(input.body ?? '').trim();
  const website = String(input.website ?? '').trim();
  const parentId = input.parentId ? String(input.parentId) : null;

  if (website) return { error: 'Unable to accept comment.' };
  if (authorName.length < 1 || authorName.length > 60) return { error: 'Name must be 1-60 characters.' };
  if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) return { error: 'Email is invalid.' };
  if (body.length < 1 || body.length > 3000) return { error: 'Comment must be 1-3000 characters.' };
  if (!maxUrlsAllowed(body)) return { error: 'Too many links in this comment.' };
  if (!input.isAuthor && usesReservedAuthorName(authorName)) return { error: 'That name is reserved.' };

  return { authorName, authorEmail: authorEmail || null, body, parentId };
}
