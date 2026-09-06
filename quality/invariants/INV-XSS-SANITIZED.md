---
id: 'INV-XSS-SANITIZED'
description: 'All user-authored markdown content rendered into client DOM must pass through DOMPurify or equivalent strict HTML sanitization rules.'
enforcementMechanism: 'DOMPurify sanitization in shared/content script markdown pipelines and automated XSS fuzzing suites.'
---

# Invariant: Strict Markdown DOM Sanitization

User comments allow arbitrary markdown including HTML blocks. To eliminate cross-site scripting risks, all rendered HTML must be sanitized before DOM injection.
