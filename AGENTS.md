# Repository Instructions

## Development standards

- Read `README.md` and relevant project documentation before making changes.
- Follow the approved requirements in `docs/PROJECT.md`, `docs/FEATURES.md`, and `docs/DEVELOPMENT_PHASES.md`.
- Use React, TypeScript, Vite, Tailwind CSS, and browser-local `localStorage`.
- Use Bun for package management and local development commands. Keep `bun.lock` committed and do not regenerate npm lockfiles.
- Keep study data local. Do not introduce a backend, cloud service, remote API, remote font, or network-loaded core asset.
- Keep implementations simple, maintainable, accessible, responsive, and type-safe.
- Avoid unnecessary dependencies and unrelated changes.
- Keep documentation current when the project changes.

## Validation policy

- Focus exclusively on application development until testing is explicitly requested.
- Do not write or configure unit, component, integration, or end-to-end tests.
- Do not create test files, test scripts, testing CI workflows, or alternative testing frameworks.
- Keep Vitest and Playwright listed as planned technologies for future use, but do not configure or execute them yet.
- Once the application is installed, use TypeScript type checking, ESLint, and production builds as development validation.
- Do not claim that tests have been performed when they have not.

## Git workflow

- Before starting each development phase, synchronize local `main` with `origin/main` and verify that the working tree is clean.
- Use one dedicated `feat/` branch and one pull request targeting `main` for each development phase.
- Follow the branch names documented in `docs/DEVELOPMENT_PHASES.md`:
  - Phase 1: `feat/app-foundation`
  - Phase 2: `feat/local-data-model`
  - Phase 3: `feat/category-topic-crud`
  - Phase 4: `feat/entry-list-study`
  - Phase 5: `feat/flashcard-study-mode`
  - Phase 6: `feat/dashboard-overview`
  - Phase 7: `feat/settings-preferences`
  - Phase 8: `feat/pomodoro-timer`
  - Phase 9: `feat/json-backup-restore`
  - Phase 10: `feat/local-pdf-export`
  - Phase 11: `feat/offline-pwa-shell`
- Reuse the active phase branch for all related implementation work, fixes, refinements, and documentation updates.
- Allow multiple focused Conventional Commits within a phase.
- Do not create additional branches or pull requests for individual fixes or refinements.
- Review the diff and stage only relevant files before committing.
- Keep phase pull requests open for review until explicit approval to merge is provided.
- Preserve every phase branch locally and remotely after merging; never automatically delete merged branches or enable automatic branch deletion on GitHub.
- Require explicit approval before merging pull requests, deleting branches, force-pushing, or rewriting history. Branch deletion is never part of routine closeout.
- Preserve original commits, authorship, timestamps, and Git history. Never reset, rebase, force-push, or rewrite history without explicit approval.
- Preserve unrelated work and synchronize `main` safely with `origin/main` after an approved merge, without deleting branches.

## Pull requests and attribution

- Write concise, natural, professional pull request descriptions with `Summary`, `Changes`, and `Validation` sections.
- Keep pull requests focused on what changed, why it matters, and applicable validation.
- Reference Jira issues only when real issue IDs are provided.
- Never invent validation results.
- Preserve the configured Git identity: `xmuwisa <95476379+xmuwisa@users.noreply.github.com>`.
- Do not override author or committer metadata or add unnecessary AI co-author attribution.
