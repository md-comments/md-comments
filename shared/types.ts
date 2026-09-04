export interface Reaction {
  emoji: string;
  users: string[];
}

export interface Reply {
  id: string;
  author: string;
  body: string;
  created_at: string;
  updated_at?: string;
  reactions: Reaction[];
}

export interface PageComment {
  id: string;
  author: string;
  body: string;
  created_at: string;
  updated_at?: string;
  resolved: boolean;
  resolved_at?: string;
  reactions: Reaction[];
  replies: Reply[];
}

export interface InlineComment {
  id: string;
  author: string;
  anchor_text: string;
  anchor_hash: string;
  paragraph_index: number;
  heading_context: string;
  anchor_occurrence?: number;
  body: string;
  created_at: string;
  updated_at?: string;
  orphaned: boolean;
  orphaned_at?: string;
  resolved: boolean;
  resolved_at?: string;
  reactions: Reaction[];
  replies: Reply[];
}

export interface CommentsFile {
  page_comments: PageComment[];
  inline_comments: InlineComment[];
}

export type CommentRootType = 'page' | 'inline';

export interface AnchorBlock {
  paragraph_index: number;
  heading_context: string;
  anchor_hash: string;
  anchor_text: string;
  line_number?: number;
}

export interface PlacementResult {
  comment: InlineComment;
  placed: boolean;
  paragraphIndex: number | null;
}
