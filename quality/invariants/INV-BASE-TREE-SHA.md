---
id: 'INV-BASE-TREE-SHA'
description: 'Git Data API tree creation must resolve and supply the commit base tree SHA (commitData.tree.sha), not the commit object SHA.'
enforcementMechanism: 'Unit test assertions in tests/gitRefBackend.test.ts verifying GET /git/commits/:sha invocation before POST /git/trees.'
---

# Invariant: Base Tree SHA Resolution

The GitHub Git Data API endpoint `POST /repos/:owner/:repo/git/trees` strictly requires the `base_tree` parameter to be the 40-character SHA of a Git Tree object. Supplying a Commit object SHA triggers an unrecoverable `422 Unprocessable Entity` failure. The backend must query `GET /repos/:owner/:repo/git/commits/:commitSha` and extract `commitData.tree.sha` prior to constructing tree changes.
