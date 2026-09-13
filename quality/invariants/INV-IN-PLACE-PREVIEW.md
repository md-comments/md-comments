---
id: 'INV-IN-PLACE-PREVIEW'
description: 'Native preview comments and thread badges must update in-place without reloading document DOM, preventing blank screen flicker, tab resets, and scroll jumping.'
enforcementMechanism: 'E2E webview assertions in Playwright and unit tests verifying DOM patch operations without preview refresh.'
---

# Invariant: In-Place Preview DOM Mutation

All interactive comment modifications, reactions, thread expansions, and sequential deletions within IDE native preview panes must execute via targeted in-place DOM manipulation rather than full document re-renders. Reloading the markdown document DOM causes jarring visual flicker, resets user scroll positions, pauses embedded media, and breaks active input focus.
