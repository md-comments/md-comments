export interface MdCommentsPluginOptions {
  /**
   * GitHub repository in "owner/repo" format where comments are stored in refs/md-comments/data.
   * If omitted, attempts to auto-detect from git or metadata.
   */
  repo?: string;

  /**
   * Target branch name (defaults to 'main').
   */
  branch?: string;

  /**
   * Base directory path for documentation files in the repository (e.g. 'src/content/docs' or 'docs').
   * Defaults to 'src/content/docs'.
   */
  docBasePath?: string;

  /**
   * Site base path (e.g. '/demo-astro' or '/').
   */
  base?: string;

  /**
   * GitHub OAuth App Client ID for Device Flow authentication.
   * Defaults to the official Markdown Comments client ID.
   */
  clientId?: string;

  /**
   * Custom auth proxy URL (e.g. Cloudflare Worker or backend proxy) for GitHub OAuth Device Flow.
   */
  authProxyUrl?: string;

  /**
   * Custom UI configuration options.
   */
  ui?: {
    /**
     * Width of the comments side drawer in pixels (default: 360).
     */
    drawerWidth?: number;

    /**
     * Emojis available for reactions.
     */
    reactionEmojis?: string[];

    /**
     * Position of margin indicators ('right' | 'left', default: 'right').
     */
    indicatorPosition?: 'right' | 'left';
  };
}
