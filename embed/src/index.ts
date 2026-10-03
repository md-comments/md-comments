export interface MdCommentsOptions {
  repo?: string;
  file?: string;
  branch?: string;
  theme?: 'light' | 'dark' | 'auto';
  selector?: string;
  mock?: boolean;
  clientId?: string;
  [key: string]: unknown;
}

export function initMdComments(options?: MdCommentsOptions): void {
  if (typeof window === 'undefined') return;
  if (options) {
    (
      window as unknown as { __MD_COMMENTS_OPTIONS__?: Record<string, unknown> }
    ).__MD_COMMENTS_OPTIONS__ = {
      ...((window as unknown as { __MD_COMMENTS_OPTIONS__?: Record<string, unknown> })
        .__MD_COMMENTS_OPTIONS__ || {}),
      ...options,
    };
  }
}

export default initMdComments;
