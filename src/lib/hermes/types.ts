export type TopicSource = 'hn' | 'tavily';
export type TopicStatus = 'candidate' | 'drafting' | 'drafted' | 'dismissed';
export type JobType = 'discover' | 'draft' | 'revise';
export type JobStatus = 'queued' | 'running' | 'done' | 'error';

export interface HermesTopic {
  id: string;
  title: string;
  url: string;
  source: TopicSource;
  score: number;
  snippet: string | null;
  status: TopicStatus;
  draftPostId: string | null;
  discoveredAt: string;
}

export interface HermesJob {
  id: string;
  type: JobType;
  status: JobStatus;
  stage: string | null;
  topicId: string | null;
  draftPostId: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Shape returned by discovery before persistence. */
export interface DiscoveredTopic {
  title: string;
  url: string;
  source: TopicSource;
  score: number;
  snippet?: string;
}
