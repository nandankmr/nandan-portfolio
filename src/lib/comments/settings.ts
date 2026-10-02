export function commentsGloballyEnabled() {
  return process.env.COMMENTS_ENABLED !== 'false';
}

export function maxUrlsAllowed(body: string) {
  const urls = body.match(/https?:\/\/|www\./gi);
  return (urls?.length ?? 0) <= 3;
}

export function normalizeReservedName(name: string) {
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

export function usesReservedAuthorName(name: string) {
  return normalizeReservedName(name) === 'nandankumar';
}
