# Tricentis Architecture

Central home for **architecture documentation** across Tricentis products and platforms.

**This repository is the source of truth** — content is authored and reviewed here as Markdown so it can be versioned, reviewed in Git, and used in an Agentic AI SDLC.

The static site is built with **[Astro Starlight](https://starlight.astro.build/)** and published to **GitHub Pages** on every push to `main` via [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml) available via **https://architecture.tricentis.com/**

## What lives here

| Area                                    | Location                                                                           | Description                                                                                                                                                               |
| --------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **High-level documentation (HLD)**      | [`src/content/docs/HLDs/`](src/content/docs/HLDs/)                                 | Product architecture topics (security, data protection, infrastructure, integration, observability, resilience). See [`HLDs/README.md`](src/content/docs/HLDs/README.md). |
| **Architecture decision records (ADR)** | [`src/content/docs/ADRs/`](src/content/docs/ADRs/)                                 | Recorded architecture decisions, organized by Confluence space key.                                                                                                       |
| **Architecture design documents (ADD)** | [`src/content/docs/ADDs/`](src/content/docs/ADDs/)                                 | Detailed design documents, organized by Confluence space key.                                                                                                             |
| **Request for Comments (RFC)**          | [`src/content/docs/RFCs/`](src/content/docs/RFCs/)                                 | Architecture proposals open for review before they become ADRs or other committed documentation.                                                                          |
| **Diagrams**                            | [`src/content/docs/Diagrams/`](src/content/docs/Diagrams/)                         | C4 models, integrations, and network diagrams. D2 sources use the shared Tricentis theme in [`d2/`](d2/).                                                                 |
| **Confluence migration**                | [`src/content/docs/confluence-migration/`](src/content/docs/confluence-migration/) | Import scripts, known Confluence sources, and Milvus embedding notes.                                                                                                     |
| **Scripts**                             | [`scripts/`](scripts/)                                                             | Embedding, optional Confluence import, and other maintenance tooling.                                                                                                     |

Additional documentation may be added over time; the layout above is the current convention, not an exhaustive list.

## Repository layout (Starlight)

```
src/content/docs/
├── index.mdx                 # Site homepage (splash)
├── Diagrams/                 # C4, integrations, network (D2 + Mermaid)
├── RFCs/                     # RFCs by Confluence space key
├── HLDs/                     # High-level docs by product
├── ADRs/                     # ADRs by Confluence space key
├── ADDs/                     # ADDs by Confluence space key
└── confluence-migration/     # Confluence sync & embedding guide

d2/                          # Shared D2 theme, assets, and examples
docs/d2-tour/                # Offline copy of the D2 language tour
```

## Confluence migration

Some content was originally authored in Confluence. Optional import scripts and historical source URLs are documented in **[`src/content/docs/confluence-migration/`](src/content/docs/confluence-migration/)**—use them to backfill or reconcile legacy pages, not as the primary editing workflow.

## Local development

Browse the Starlight site locally before pushing:

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:4321`). All site content lives under `src/content/docs/`. Run `npm run build` to produce the same static output that GitHub Pages deploys.

### D2 diagrams

[D2](https://d2lang.com/) diagram sources live under `src/content/docs/Diagrams/` and import the shared Tricentis theme from [`d2/tricentis-global.d2`](d2/tricentis-global.d2).

To render a D2 source locally (requires the [D2 CLI](https://d2lang.com/tour/install)):

```bash
d2 "src/content/docs/Diagrams/Integrations/Tricentis AI/tricentis-ai-cid.d2" out/tricentis-ai-cid.svg
```

See [`d2/README.md`](d2/README.md) for theme usage and icon classes.

### GitHub Pages Notes

Deployment uses the [`withastro/action`](https://github.com/withastro/action) build step and [`actions/deploy-pages`](https://github.com/actions/deploy-pages).
