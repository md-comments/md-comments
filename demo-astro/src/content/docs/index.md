---
title: Markdown Comments Demo
description: Live interactive demonstration of Markdown Comments on Astro Starlight.
template: splash
hero:
  tagline: AI-orchestrated docs. Human-orchestrated comments. Highlight any text on rendered views to leave comments without SaaS silos!
  actions:
    - text: Try the Interactive Sandbox
      link: /demo-astro/guides/sandbox/
      icon: right-arrow
      variant: primary
    - text: Return to Main Website
      link: /
      icon: external
      variant: secondary
---

<div class="demo-access-callout" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.18) 100%) !important; border: 2px solid #f59e0b !important; box-shadow: 0 0 24px rgba(245, 158, 11, 0.22) !important; border-radius: 0.75rem !important; padding: 1.25rem 1.5rem !important; margin: 1.5rem 0 2rem 0 !important; text-align: left !important;">
  <div class="demo-access-header" style="display: flex !important; align-items: center !important; gap: 0.5rem !important; font-size: 1.05rem !important; font-weight: 800 !important; color: #fbbf24 !important; margin-bottom: 0.5rem !important; letter-spacing: -0.2px !important;">
    <span>🔑</span>
    <span style="font-weight: 800; color: #fbbf24;">CRITICAL: Instructions to Get Write Access to Leave Comments</span>
  </div>
  <p class="demo-access-desc" style="font-size: 0.95rem !important; line-height: 1.6 !important; margin-bottom: 1rem !important; color: #e2e8f0 !important;">
    Comments on this demo are <strong style="color: #f59e0b; font-weight: 700;">public to view</strong> for everyone. However, to add or reply to comments, GitHub requires repository collaborator access. You <strong style="color: #f59e0b; font-weight: 700;">must</strong> complete this 1-click step to get the demo working:
  </p>
  <div class="demo-access-action" style="display: flex !important; align-items: center !important; gap: 0.85rem !important; flex-wrap: wrap !important;">
    <a
      href="https://github.com/md-comments/demo-access/issues/new?template=request-demo-access.md"
      target="_blank"
      rel="noopener noreferrer"
      class="btn-access-request"
      style="display: inline-flex !important; align-items: center !important; gap: 0.4rem !important; background: #f59e0b !important; color: #0f172a !important; font-weight: 800 !important; font-size: 0.88rem !important; padding: 0.6rem 1.2rem !important; border-radius: 0.5rem !important; text-decoration: none !important; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35) !important;"
    >
      👉 Request 1-Click Write Access (Join @md-comments/demo-commenters) &rarr;
    </a>
    <span class="demo-access-hint" style="font-size: 0.82rem !important; opacity: 0.85 !important; color: #94a3b8 !important;">Instant automated bot approval</span>
  </div>
</div>

## Key Features in This Demo

- **Rendered View Commenting**: Comment directly on rendered web prose with zero browser extensions required for visitors.
- **AI-Friendly & Zero Inline Noise**: Markdown files stay pristine in git—zero inline HTML comment pollution, zero token bloat in LLM contexts.
- **Git-Native Storage (`refs/md-comments/data`)**: Discussion threads save live to custom git refs with zero branch or PR clutter, avoiding third-party SaaS lock-in.
- **GitHub OAuth Device Flow**: Authenticate safely using standard GitHub OAuth Device Flow with zero custom backend servers required.
- **Universal Multi-Platform Sync**: Discussions left here sync seamlessly with VS Code, Cursor, Antigravity, Obsidian, and GitHub PR reviews.
