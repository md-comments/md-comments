---
title: Markdown Comments Demo
description: Live interactive demonstration of Markdown Comments on Astro Starlight.
---

> ### **AI-Orchestrated Docs. Human-Orchestrated Comments.**
>
> Docs live directly in your repository, and comments live as a native layer on top, never locked in third-party SaaS silos. AI agents orchestrate the documentation as code evolves, while humans orchestrate the reviews and discussions on rendered views.

<div class="demo-access-callout" style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(99, 102, 241, 0.18) 100%) !important; border: 2px solid #f59e0b !important; box-shadow: 0 0 24px rgba(245, 158, 11, 0.22) !important; border-radius: 0.75rem !important; padding: 1.25rem 1.5rem !important; margin: 1.5rem 0 2rem 0 !important; text-align: left !important;">
  <div class="demo-access-header" style="display: flex !important; align-items: center !important; gap: 0.5rem !important; font-size: 1.05rem !important; font-weight: 800 !important; color: #fbbf24 !important; margin-bottom: 0.5rem !important; letter-spacing: -0.2px !important;">
    <span>🔑</span>
    <span style="font-weight: 800; color: #fbbf24;">Instructions to Get Write Access to Leave Comments</span>
  </div>
  <p class="demo-access-desc" style="font-size: 0.95rem !important; line-height: 1.6 !important; margin-bottom: 1rem !important; color: #e2e8f0 !important;">
    Comments on this demo are <strong style="color: #f59e0b; font-weight: 700;">public to view</strong> for everyone. However, to add or reply to comments, GitHub requires repository collaborator access. Complete this 1-click step to get write access, or explore the <a href="/demo-mock/" style="color: #38bdf8; text-decoration: underline; font-weight: 700;">Instant Zero-Auth Mock Demo</a> with simulated personas and zero GitHub setup:
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
    <span class="demo-access-hint" style="font-size: 0.82rem !important; opacity: 0.85 !important; color: #94a3b8 !important;">Instant automated bot approval &bull; Or try <a href="/demo-mock/" style="color: #38bdf8; font-weight: 700;">Mock Demo &rarr;</a></span>
  </div>
</div>

## Sample Technical Specification

This live document demonstrates how inline comments attach directly to rendered prose. Try highlighting any sentence or inspecting the pre-existing feedback from our reviewers.

### Authentication Protocol

All client applications communicate with the backend via mutual TLS and JWT bearer tokens. Tokens expire after 60 minutes and must be refreshed using the `/api/v1/auth/refresh` endpoint.

> Should token lifetime be reduced from 60 minutes to 15 minutes for enhanced security?

### Data Storage Architecture

The storage cluster spans across three availability zones with automatic failover enabled:

- **Primary read/write node** located in `us-east-1a`
- **Synchronous standby node** located in `us-east-1b`
- **Asynchronous backup replica** located in `us-east-1c`

```typescript
export interface ClusterConfig {
  clusterId: string;
  region: 'us-east-1';
  autoFailover: boolean;
  maxReplicationLagMs: number;
}
```

### Deployment Guidelines

All production deployments must follow blue/green rollout procedures. Traffic shifting occurs in 5% intervals over a 30-minute evaluation window.

### Decentralized Data Sovereignty

> "Decentralized collaboration guarantees data sovereignty. By storing conversations directly in Git refs, technical teams retain permanent ownership of all review history and design decisions."
