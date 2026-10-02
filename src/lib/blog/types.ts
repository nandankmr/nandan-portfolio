export type BlogCategory = 'AI Engineering' | 'Essays' | 'Leadership' | 'Engineering' | 'Career';

export interface BlogPostMeta {
  id?: string;
  slug: string;
  title: string;
  description: string;
  dek: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  featured?: boolean;
  draft?: boolean;
  authoredBy?: 'human' | 'hermes';
  commentsEnabled?: boolean;
  tags: string[];
  toc?: Array<{ id: string; label: string }>;
}
