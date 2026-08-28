---
title: Interactive Discussion Sandbox
description: Test highlighting, threaded discussions, and margin pins in this sandbox environment.
---

Welcome to the live interactive sandbox! Use the sections below to test various commenting scenarios.

## Sample Technical Specification

### Authentication Protocol

All client applications communicate with the backend via mutual TLS and JWT bearer tokens. Tokens expire after 60 minutes and must be refreshed using the `/auth/refresh` endpoint.

> **Discussion prompt**: Should token lifetime be reduced from 60 minutes to 15 minutes for enhanced security?
> Highlight the sentence above and leave your vote!

### Data Storage Architecture

Database replicas are distributed across three availability zones:

- `us-east-1a`: Primary read/write node
- `us-east-1b`: Synchronous standby node
- `us-east-1c`: Read-only reporting replica

```typescript
export interface ClusterConfig {
  primaryRegion: string;
  replicas: number;
  autoFailover: boolean;
}
```

### Deployment Guidelines

All production deployments must follow blue/green rollout procedures. Canary traffic is routed to the new deployment group at 5% intervals before 100% promotion.

Highlight any line or word in this guide to experience Markdown Comments live!
