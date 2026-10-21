# Study Reviewer Project Plan

Status: Phases 1–3 are merged into `main`; Phase 4 entry management and List
Study Mode are complete on `feat/entry-list-study` and pending pull request
review. Flashcard and later study features remain planned for later phases.

## Product vision

Study Reviewer is a personal, minimalist study application for organizing and
reviewing questions, terms, answers, and explanations. It is intended to feel
calmer and more focused than a general-purpose learning platform: the user
should be able to open the app, find a topic, and study without accounts,
advertisements, recommendations, or unnecessary dashboards.

The product optimizes for:

- Simplicity and low cognitive load
- Local-first ownership of study data
- Useful offline operation after installation
- Fast navigation through a small, predictable content hierarchy
- Accessible keyboard, touch, and reduced-motion interactions
- A personalized study experience rather than a full Quizlet clone

## Scope

### Initial product scope

The initial release includes:

- The hierarchy `Category → Topic → Question & Answer or Term & Definition`
- Category, topic, and entry CRUD operations
- Dashboard overview statistics and recently accessed items
- Search and practical sorting at each content level
- List and flashcard study modes
- Light, dark, and system themes
- Local preferences and a persistent Pomodoro timer
- JSON backup and restore
- Local PDF export for a topic, category, or all content
- An installable offline application shell

### Explicit non-goals

The initial release does not include:

- Accounts, authentication, cloud sync, collaboration, or a backend
- Subscriptions, advertisements, recommendations, or gamification
- Difficulty labels, mastered states, tags, or advanced filters
- A second study-set hierarchy or arbitrary nested folders
- Social features, leaderboards, public sharing, or remote analytics
- A custom offline autocorrect engine

These may be reconsidered later only when a concrete personal-use requirement
justifies their complexity.

## Content model

The content model is deliberately flat below the three required levels:

```text
Category
└── Topic
    └── Question-and-answer entry
```

Categories contain topics, and topics contain entries. A category and topic
have a name, optional description where useful, creation/update timestamps,
and activity metadata. An entry has a type of Question & Answer or Term &
Definition, with a left-side question or term and a right-side answer or
definition. Entries do not receive additional hierarchy or metadata in the
initial version.

Use stable generated IDs and numeric timestamps. Store categories, topics, and
entries as related records rather than deeply nested copies so edits, sorting,
validation, and migrations remain predictable. Category deletion explicitly
confirms removal of its topics and entries; topic deletion explicitly confirms
removal of its entries. No orphaned content is created.

## User experience and navigation

The application is a responsive single-page client with a consistent app shell,
clear navigation, breadcrumbs, empty states, confirmations, and error
feedback. The recommended route structure is:

| Area | Recommended route | Purpose |
| --- | --- | --- |
| Dashboard | `/` | Overview statistics and recent activity |
| Categories | `/categories` | Search, sort, and manage categories |
| Category detail | `/categories/:categoryId` | Browse and manage topics |
| Topic study | `/categories/:categoryId/topics/:topicId` | Manage entries and study |
| Settings | `/settings` | Appearance, study, timer, and data preferences |

The Pomodoro timer is persistent across routes. Its compact widget should be
visible without covering primary content, while the floating Add button should
remain reachable without overlapping it. On desktop, bottom-right placement is
preferred; on smaller screens, the controls should use safe-area insets and a
layout that keeps both controls usable.

## Architecture

The application is a client-only React SPA with clear boundaries:

1. **Presentation** — pages, reusable controls, dialogs, responsive layouts,
   and accessible study interactions.
2. **Domain state** — category/topic/entry operations, settings, recent
   activity, study-mode state, and Pomodoro state.
3. **Persistence adapter** — versioned serialization, validation, migrations,
   and local storage access behind a small repository interface.
4. **Data operations** — JSON import/export and local PDF generation.
5. **Offline shell** — bundled assets, manifest, service worker, and cache
   behavior for an installed application.

Keep domain operations independent from React components. Components should
not directly manipulate serialized storage records. This makes validation,
unit testing, and a future IndexedDB adapter possible without changing the
user-facing features.

### Initial persistence recommendation

Use `localStorage` for the first implementation because the expected personal
dataset is small, synchronous access is simple, and JSON backup is natural.
Every stored document must include a schema version and pass validation before
it is used. Keep storage access behind an adapter so the project can migrate
to IndexedDB if entry counts, serialized size, or synchronous writes become a
real limitation. Do not add IndexedDB infrastructure speculatively.

Browser storage is specific to a browser and origin. Clearing site data,
changing the local host or port, using another browser, or uninstalling an
application can make data unavailable. JSON export is therefore a first-class
backup path, not an optional convenience.

## Technology stack

- **React + TypeScript** for the client UI and type-safe domain boundaries
- **Vite** for development and production builds
- **Tailwind CSS** for consistent responsive styling and theme tokens
- **Browser-local persistence** with `localStorage` behind an adapter
- **Vitest** for domain, persistence, component, and timer tests
- **Playwright** for critical end-to-end workflows and responsive checks

Do not add a backend, remote API, remote font, cloud storage, or network-loaded
asset for core functionality.

## Offline strategy

Running a local development server and using an installed offline application
are different experiences:

- A development server is a local process used while building and testing. It
  may require the development toolchain and is not itself the offline product.
- The installed application should use a production build with a manifest and
  service worker that cache the application shell and all core assets. After a
  successful installation or first load, dashboard navigation, study flows,
  persistence, timer behavior, JSON backup/restore, and PDF generation should
  work without internet access.

The implementation should begin with a normal Vite build and add an installable
PWA shell in a dedicated phase. Prefer the smallest maintainable service-worker
approach; use a Vite PWA plugin only if it materially reduces complexity. Keep
fonts and assets local so the offline experience does not depend on a remote
request. Localhost is suitable for development and local installation; a
future hosted deployment is not required for the product to be useful.

## Design decisions

### One content hierarchy

Categories and topics provide enough organization for personal study. Adding
sets, decks, folders, tags, or difficulty states would increase navigation and
data migration cost without solving an identified initial need.

### Two complementary study modes

List mode supports scanning, comparing, and selectively revealing answers.
Flashcard mode supports focused recall one entry at a time. Both modes use
the same entries and should not create separate copies of study data.

### Predictable visibility controls

Both List Mode columns remain visible by default. Question / Term content is
revealed by default, while Answer / Definition content is hidden by default.
The controls have separate responsibilities:

- `Hide Left` / `Reveal Left` toggles the question or term content in every
  card while keeping the left column visible.
- `Hide Right` / `Reveal Right` toggles the answer or definition content in
  every card while keeping the right column visible.
- Clicking an individual left or right cell reveals or hides only that cell.

These controls must not silently change saved content or confuse column
visibility with individual answer reveal state.

### Timestamp-based Pomodoro behavior

Timer state uses timestamps and persisted session records rather than trusting
the frequency of JavaScript intervals. This allows refreshes, navigation,
inactive tabs, and reopened applications to reconcile elapsed time correctly.
Users can change the current duration with a horizontal slider or by directly
rotating the tomato dial. Clockwise rotation increases the duration;
counterclockwise rotation decreases the duration. Both controls update the
same selected duration. During a countdown, the dial visually progresses
toward zero.
Dragging or rotating must not accidentally modify an active countdown. Manual
duration changes affect only the current session, not the saved mode defaults,
and precise duration controls must also be available without dragging.

Only a Focus session that reaches completion counts toward statistics. A
running Focus session may be recorded as completed when its persisted end
timestamp has passed, including after the application was closed. Each such
completion is recorded exactly once. Paused, reset, or abandoned sessions do
not count, while a manually adjusted Focus session still counts as one
completed Focus session.

After the configured number of completed Focus sessions, the next break is
Long Break instead of Short Break. After completing the Long Break, reset the
Focus cycle counter. If the user manually switches modes while a session is
running or paused, the application asks for confirmation before abandoning that
session; confirming discards the incomplete session, selects the new mode's
saved default duration, and does not start it automatically. Cancelling keeps
the current session. Switching modes with no active or paused session is
immediate. Auto-switch remains enabled by default. Auto-start remains disabled
by default.

### Mechanical tomato visual direction

The Pomodoro control follows a specific minimalist visual reference rather
than an invented timer treatment: a large circular red tomato, small green
leaves near the top, a pale peach outer ring with minute tick marks, and a
large white minute display centered inside the tomato. The design is clean,
flat, and uncluttered. The full interface places Focus, Short Break, and Long
Break selection above the timer, a horizontal duration slider beneath it, and
Start, Pause, Resume, and Reset controls below it. The compact persistent
widget uses the same visual language at a smaller scale.

### Local exports

JSON is the portable backup format. PDF export is generated in the browser so
it works offline and does not expose study content to a service. Initial PDF
exports should favor readable, predictable layouts over elaborate styling.

## Quality requirements

- Keyboard and screen-reader access for navigation, dialogs, study controls,
  flashcards, timer controls, and form errors
- Visible focus states, sufficient contrast, semantic headings, and labels
- Responsive layouts for desktop and mobile without hiding core actions
- Reduced-motion support and a non-drag alternative for the timer dial
- Confirmation before destructive operations and validation before imports
- Clear empty, loading, invalid-data, and storage-error states
- No claim that data is cloud-synchronized or recoverable after browser storage
  is cleared

## Open decisions

The following decisions should be resolved during implementation planning,
without changing the product direction:

1. Which local PDF library or browser-print strategy gives the smallest
   reliable offline bundle and the best page-break control?
2. Whether the initial PWA shell should use a small hand-written service worker
   or a Vite-compatible plugin after measuring setup and maintenance cost.
3. What practical storage-size signal should trigger an IndexedDB migration.
4. Whether optional browser notifications should be enabled only after an
   explicit permission request and how unsupported browsers should fall back.
5. The exact recovery policy for an active timer when the application is closed
   before its scheduled end; the default recommendation is to reconcile from
   persisted timestamps on reopen and count completion only if the end time has
   passed.
6. Whether importing a valid JSON backup replaces all current data after a
   confirmation, or whether a later version should add merge support. The MVP
   recommendation is validated replace-after-confirmation, with an export
   reminder before replacement.
