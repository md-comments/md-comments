# Agentic AI Code Review Guide

This project contains custom agent skills and guidelines configured under the `.agents/` workspace directory. These resources allow AI coding assistants (like Antigravity or Gemini) to run specialized review passes and quality checks.

## AI Review Commands

When pair-programming with an Antigravity coding assistant, you can invoke the following commands:

1. **Over-Engineering & Bloat Audit (`/ponytail-review` / `/ponytail-audit`)**:
   - Instructs the agent to check your current diff or the entire repository for complex structures, redundant dependencies, or reinvented standard library features.
   - Highlights components that can be simplified, deleted, or replaced with native JS/TS methods.

2. **Ultra-Compressed Code Review (`/caveman-review`)**:
   - Requests a dense, high-signal code review. The agent will output one concise line per issue (pointing to file, line, problem, and expected fix) to minimize context token clutter.

3. **Conventional Commit Generator (`/caveman-commit`)**:
   - Generates minimal and meaningful Conventional Commits based strictly on staged changes, keeping commit logs clean.

4. **Repository Briefing & Context Density (`/context-pack`)**:
   - Generates a compact, high-signal repository briefing containing primary languages, entry points, active changes, and high-signal files.
   - Helps onboard coding agents to the repository without wasting prompt budget on a blind tree walk.

## Security Static Analysis (SAST) & SCA

- Ensure ESLint security plugins check for vulnerable dynamic templates.
- Always run `pnpm audit` locally before committing to check for dependency vulnerabilities.
