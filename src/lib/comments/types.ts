export type CommentStatus = 'visible' | 'deleted';

export interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_name: string;
  author_email: string | null;
  body: string;
  is_author: boolean;
  status: CommentStatus;
  ip: string;
  user_agent: string;
  tg_message_id: string | null;
  created_at: Date;
  post_slug?: string;
  post_title?: string;
}

export interface PublicComment {
  id: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isAuthor: boolean;
  createdAt: string;
  replies: PublicComment[];
}
