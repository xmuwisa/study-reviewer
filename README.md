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

The Phase 1 application foundation is merged into `main`: a responsive React
shell with centered top navigation, route placeholders, local styling tokens,
reusable UI primitives, and a static Pomodoro widget. Phase 2 is active on
`feat/local-data-model` and adds the typed local data model, validation,
versioned localStorage adapter, and JSON export foundation. Testing
infrastructure and test coverage remain intentionally deferred until
explicitly requested. CRUD flows, study modes, and the functional Pomodoro
timer remain planned for later phases.

The product and implementation roadmap are documented in:

- [Project plan](docs/PROJECT.md)
- [Feature specifications](docs/FEATURES.md)
- [Development phases](docs/DEVELOPMENT_PHASES.md)

## Local development

```sh
bun install
bun run dev
```

The current shell is intentionally a foundation. It does not yet provide
study-data creation, editing, persistence, or timer functionality.
