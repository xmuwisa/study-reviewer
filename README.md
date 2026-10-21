# Study Reviewer

Study Reviewer is a personal, local-first web application for studying
questions, terms, answers, and explanations.

## Planned features

- Add, edit, and delete study entries
- Organize entries into categories
- View questions and answers in two columns
- Study entries in List Mode or Flashcard Mode
- Reveal or hide either study column or individual answers
- Search entries and filter by category
- Persist study data locally
- Import and export data as JSON

## Intended technology

React, TypeScript, Vite, Tailwind CSS, `localStorage`, Vitest, and Playwright.
The project uses Bun for package management and local development commands.

## Project status

The Phase 1 application foundation through Phase 6 Dashboard Overview are
merged into `main`. Phase 7 Settings and Preferences is complete on
`feat/settings-preferences` and adds local theme, study-session, flashcard,
spellcheck, copy/paste, and Pomodoro preferences. Testing infrastructure and
test coverage remain intentionally deferred until explicitly requested.
The functional Pomodoro timer remains planned for a later phase.

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
types, navigation, search, sorting, List Study Mode, Flashcard Study Mode,
column and answer visibility controls, dashboard statistics, recent activity,
context-aware creation navigation, local persistence, and Settings preferences.
The functional Pomodoro timer, data management, and export workflows remain
planned for later phases.
