# Markdown Comments Test Fixture

This is a standardized sample document for end-to-end regression testing of the Markdown Comments engine.

## Paragraph Anchoring

Paragraph one provides baseline text for verifying deterministic content-based SHA-256 anchoring.

Paragraph two contains text that can be targeted for inline commenting and reply threads.

Paragraph three is reserved for testing reactions, @mentions, and orphan resolution workflows.

## Code Blocks

```typescript
function calculateAnchor(content: string): string {
  // Deterministic paragraph hash
  return hash(content.trim());
}
```

## Tables

| Feature         | Interface             | Status    |
| :-------------- | :-------------------- | :-------- |
| Inline Comments | Chrome Extension      | Supported |
| Git Ref Backend | refs/md-comments/data | Supported |
| Device Auth     | RFC 8628              | Supported |

## Blockquotes

> Collaborative Markdown comments stored decentralized in Git refs.
> Zero third-party databases required.
