---
id: 'INV-FAST-FORWARD-RETRY'
description: 'All remote writes to refs/md-comments/data must handle fast-forward concurrency collisions by automatically pulling remote changes, three-way merging, and retrying up to 3 times.'
enforcementMechanism: 'Retry loop and three-way merging algorithm in shared/gitRefBackend.ts validated by concurrency unit tests.'
---

# Invariant: Concurrency Fast-Forward Auto-Retry

When multiple users or automated systems comment concurrently on the same repository, updates to the Git ref must merge non-conflicting comment files and re-attempt git ref updates.
