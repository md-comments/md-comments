---
id: 'INV-VISUAL-PARITY'
description: 'All user-facing surfaces (GitHub Extension, VS Code Extension, and Demo sites) must adhere to canonical design tokens and maintain 100% visual/UX component parity without visual drift.'
enforcementMechanism: 'Automated Playwright visual regression suite and design token WCAG contrast testing in nightly CI regression.'
---

# Invariant: Cross-Interface Visual & UX Parity

Markdown Comments provides collaborative feedback across multiple surfaces (GitHub, VS Code, and Demo playgrounds). To preserve a unified user experience, all interfaces must implement canonical components (FAB, Drawer, Card, Composer, Reaction Bar) and strictly consume shared design tokens without untracked visual drift.
