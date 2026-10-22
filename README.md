# Study Reviewer

Study Reviewer is a calm, local-first web application for organizing and
reviewing questions, terms, answers, and explanations. It is designed for
focused study without accounts, advertising, recommendations, or cloud-
dependent data storage.

## Current application

The application foundation provides:

- A responsive dashboard, categories, category detail, topic study, and
  settings route structure
- Keyboard-friendly navigation with visible focus states and breadcrumbs
- A mobile-aware application shell with touch-sized controls
- A local-first visual language for future study content
- A compact placeholder for the planned focus timer

The study library, local persistence, review modes, preferences, exports, and
offline installation will build on this foundation. Study data is intended to
remain in the current browser and device through `localStorage`; no backend,
account, cloud sync, remote API, remote font, or network-loaded core asset is
required.

## Technology

The project uses React, TypeScript, Vite, Tailwind CSS, shadcn/ui primitives,
and Bun for package management and local development. Vitest and Playwright
remain planned validation technologies and will be introduced when testing
work is explicitly requested.

## Local development

Prerequisite: [Bun](https://bun.sh/).

```sh
bun install
bun run dev
```

The available validation commands are:

```sh
bun run typecheck
bun run lint
bun run build
```

Study Reviewer keeps personal study data in the browser where it is created.
JSON backup and restore will provide a portable way to preserve local study
materials as the library features are added.
