# Study Reviewer

Study Reviewer is a personal, local-first web application for studying
questions, terms, answers, and explanations.

## Planned features

- Add, edit, and delete study entries
- Organize entries into categories
- View questions and answers in two columns
- Reveal or hide either study column or individual answers
- Search entries and filter by category
- Persist study data locally
- Import and export data as JSON

## Intended technology

React, TypeScript, Vite, Tailwind CSS, `localStorage`, Vitest, and Playwright.
The project uses Bun for package management and local development commands.

## Project status

The Phase 1 application foundation, Phase 2 local data foundation, and Phase 3
category/topic CRUD are merged into `main`. Phase 4 is active on
`feat/entry-list-study` and adds local typed-entry management, search, sorting,
and responsive List Study Mode. Testing infrastructure and
test coverage remain intentionally deferred until explicitly requested.
Flashcard Mode, settings, and the functional Pomodoro timer remain planned for
later phases.

The product and implementation roadmap are documented in:

- [Project plan](docs/PROJECT.md)
- [Feature specifications](docs/FEATURES.md)
- [Development phases](docs/DEVELOPMENT_PHASES.md)

## Local development

```sh
bun install
bun run dev
```

The current implementation provides category, topic, and question-and-answer
entry creation, editing, deletion, Question & Answer and Term & Definition
types, navigation, search, sorting, column and answer visibility controls, and
local persistence. Flashcard Mode, settings, and timer functionality remain
planned for later phases.
