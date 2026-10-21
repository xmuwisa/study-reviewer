# Study Reviewer

Study Reviewer is a personal, local-first web application for studying
questions, terms, answers, and explanations.

## Planned features

- Add, edit, and delete study entries
- Organize entries into categories
- View questions and answers in two columns
- Reveal or hide answers globally or individually
- Search entries and filter by category
- Persist study data locally
- Import and export data as JSON

## Intended technology

React, TypeScript, Vite, Tailwind CSS, `localStorage`, Vitest, and Playwright.
The project uses Bun for package management and local development commands.

## Project status

The Phase 1 application foundation and Phase 2 local data foundation are
merged into `main`. Phase 3 is complete on `feat/category-topic-crud` and adds
functional category and topic management with local persistence, search,
sorting, recent access activity, safe cascade deletion, and responsive CRUD
interfaces. Testing infrastructure and test coverage remain intentionally
deferred until explicitly requested. Entry CRUD, study modes, and the
functional Pomodoro timer remain planned for later phases.

The product and implementation roadmap are documented in:

- [Project plan](docs/PROJECT.md)
- [Feature specifications](docs/FEATURES.md)
- [Development phases](docs/DEVELOPMENT_PHASES.md)

## Local development

```sh
bun install
bun run dev
```

The current implementation provides category and topic creation, editing,
navigation, deletion, and local persistence. Entry management, study modes,
and timer functionality remain planned for later phases.
