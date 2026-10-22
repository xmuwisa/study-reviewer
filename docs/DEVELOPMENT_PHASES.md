# Study Reviewer Development Phases

This roadmap is for implementation after the planning documents are approved.
The Phase 1 application foundation and Phase 2 local data foundations are
merged into `main`: the responsive React/Vite shell, Tailwind and shadcn
styling, route placeholders, reusable UI primitives, typed records, runtime
validation, and versioned localStorage adapter are present. Phase 3 category
and topic CRUD is complete and merged into `main`. Phase 4 entry management
and List Study Mode are complete and merged into `main`. Phase 5 Flashcard
Study Mode is complete and merged into `main`. Phase 6 Dashboard Overview is
complete and merged into `main`. Phase 7 Settings and Preferences is complete
and merged into `main`. Phase 8 Persistent Pomodoro Timer is implemented on
the active `feat/pomodoro-timer` branch and ready for review. Vitest and
Playwright configuration and test files remain intentionally deferred until
explicitly requested; later phases remain planned and unimplemented.
Each phase is intentionally small enough for a focused branch and pull
request. Keep the branch names illustrative; use the repository's normal
prefix conventions when creating them.

## Delivery principles

- Build the smallest complete slice before adding polish.
- Keep the domain model and persistence boundary ahead of dependent UI.
- Add tests with each behavior rather than postponing all verification.
- Treat accessibility and responsive behavior as acceptance criteria, not a
  final cleanup pass.
- Preserve local-only operation throughout the roadmap.
- Do not add optional enhancements until the essential MVP is usable and
  backed up safely.

## Essential MVP phases

### Phase 1 — Application foundation

**Suggested branch:** `feat/app-foundation`

**Dependencies:** none.

**Deliverables**

- React + TypeScript + Vite application shell
- Tailwind CSS configuration and a small set of design tokens
- Route structure for Dashboard, Categories, Category Detail, Topic Study, and
  Settings
- Responsive app shell with navigation, breadcrumbs, focus styles, and a
  placeholder for the persistent timer
- Vitest and Playwright configuration without implementing product features

**Acceptance criteria**

- The application starts and renders each route without runtime errors.
- Navigation works with keyboard and touch-sized controls.
- The layout is usable at desktop and mobile widths.
- No remote font or network-loaded asset is required for the shell.

**Verification**

- Run the configured type check, lint/format checks if present, and unit test
  command.
- Run a Playwright smoke test that loads the shell and navigates each route.
- Review keyboard focus and responsive screenshots manually.

### Phase 2 — Domain model and local persistence

**Suggested branch:** `feat/local-data-model`

**Dependencies:** Phase 1.

**Deliverables**

- Typed Category, Topic, Entry, settings, activity, and timer records
- Schema version and runtime validation for stored data
- Repository/adapter boundary for `localStorage`
- Initial defaults, safe read/write behavior, and migration entry point
- Storage error handling for unavailable or full storage
- Basic JSON export using the same versioned data format required by the later
  full backup and restore workflow

**Acceptance criteria**

- A fresh install starts with valid empty data and default settings.
- Valid data survives reloads and invalid data does not crash the application.
- Records use stable IDs and timestamps.
- Storage operations are not called directly from presentation components.
- A user can export the current local data as a versioned JSON file before
  building a substantial study library.

**Verification**

- Unit-test serialization, validation, defaults, malformed data, and storage
  failures.
- Test a schema-version migration fixture.
- Verify that the basic export contains the versioned data shape without
  claiming that full import/restore exists yet.
- Verify persistence across a browser reload in Playwright.

### Phase 3 — Categories, topics, and navigation

**Suggested branch:** `feat/category-topic-crud`

**Status:** Complete on `feat/category-topic-crud`; pending pull request review.

**Dependencies:** Phases 1–2.

**Deliverables**

- Categories list with search, sorting, cards, counts, and empty states
- Category creation, rename, open, and deletion flows
- Category detail page with topic search, sorting, cards, and counts
- Topic creation, editing, opening, and deletion flows
- Confirmation dialogs with nested-content counts
- Recent category/topic access timestamps

**Acceptance criteria**

- Users can create, edit, open, and delete categories and topics.
- Category deletion removes its topics and entries only after confirmation.
- Topic deletion removes its entries only after confirmation.
- Search and sorting do not change stored data.
- Empty and no-result states offer useful next actions.

**Verification**

- Unit-test CRUD operations, cascade deletion, sorting, search, and activity
  updates.
- Add Playwright coverage for category-to-topic navigation and cancel/confirm
  deletion behavior.
- Check keyboard dialog focus and mobile card layouts.

### Phase 4 — Entries and List Mode

**Suggested branch:** `feat/entry-list-study`

**Status:** Complete and merged into `main`.

**Dependencies:** Phase 3.

**Deliverables**

- Entry create, edit, and delete forms
- Question & Answer and Term & Definition entry types with safe migration
- Entry search by question or answer/definition
- Newest, oldest, and alphabetical sorting
- Responsive two-column List Mode
- Question / Term and Answer / Definition column visibility toggles
- Individual left and right content reveal/hide controls
- Both list columns remain visible by default, with Question / Term content
  revealed and Answer / Definition content hidden until revealed
- Responsive full-screen mobile navigation panel with active-page state

**Acceptance criteria**

- Users can manage entries without losing unrelated content.
- Required-field and storage errors are clear and preserve entered values.
- Global and individual left/right visibility controls have predictable, accessible state.
- List Mode stacks or adapts on narrow screens without losing relationships.
- Entry actions remain discoverable on hover, keyboard focus, and touch devices.

**Verification**

- Unit-test entry CRUD, text search, ordering, and visibility state transitions.
- Add Playwright coverage for creating entries and using every List Mode control.
- Perform keyboard, screen-reader-label, contrast, and mobile checks.

### Phase 5 — Flashcard Mode

**Suggested branch:** `feat/flashcard-study-mode`

**Status:** Complete and merged into `main`.

**Dependencies:** Phase 4.

**Deliverables**

- One-card question/answer presentation
- Type-aware front-side defaults and locally saved preferences
- Question & Answer defaults to Question first; Term & Definition defaults to Definition first
- Mixed sessions respect each entry's type-specific orientation preference
- Flip, Previous, Next, position indicator, and optional Shuffle
- Keyboard and reduced-motion alternatives
- Position reconciliation after search, sort, shuffle, or deletion

**Acceptance criteria**

- A flashcard always maps to the correct stored entry.
- Navigation cannot produce an invalid position.
- Shuffle changes session order only and does not rewrite entries.
- All controls work without a pointer and expose meaningful accessible names.

**Verification**

- Unit-test ordering, position boundaries, flip state, shuffle, and deletion.
- Add Playwright keyboard and touch-flow coverage.
- Check reduced-motion behavior and mobile card sizing.

### Phase 6 — Dashboard and recent activity

**Suggested branch:** `feat/dashboard-overview`

**Status:** Complete and merged into `main`.

**Dependencies:** Phases 2–5.

**Deliverables**

- Category, topic, entry, completed Focus-session, and focus-time statistics
- Recently accessed category/topic list with direct links
- Context-aware floating Add button
- Empty states and responsive placement with the Pomodoro placeholder

**Acceptance criteria**

- Counts reflect current stored data and exclude deleted content.
- Recent items update on open/study and link to valid destinations.
- No separate Quick Actions section exists.
- The Add button remains usable while scrolling and does not cover content.

**Verification**

- Unit-test derived counts and recent ordering.
- Add an end-to-end flow that creates content and confirms dashboard updates.
- Review desktop/mobile safe-area placement.

### Phase 7 — Settings and themes

**Suggested branch:** `feat/settings-preferences`

**Status:** Complete on `feat/settings-preferences`; ready for review.

**Dependencies:** Phases 2, 4, and 5.

**Deliverables**

- Light, dark, and system themes
- Default study mode and visibility preferences
- Type-aware flashcard front-side preferences with local restore defaults
- Copy/paste setting with an explanation of limitations
- Browser spellcheck setting
- Pomodoro preference fields and defaults
- About section describing local/offline storage

**Acceptance criteria**

- Preferences persist across reloads and apply to new study sessions.
- Flashcard front-side preferences persist independently for both entry types,
  and restoring flashcard defaults resets both values.
- System theme follows the browser/OS preference when selected.
- Copy/paste restrictions are scoped to relevant inputs and are not described
  as universal browser control.
- Spellcheck behavior is described as browser/OS dependent.

**Validation**

- `bun run typecheck`
- `bun run lint`
- `bun run build`

### Phase 8 — Persistent Pomodoro timer

**Suggested branch:** `feat/pomodoro-timer`

**Status:** Implemented on `feat/pomodoro-timer`; pending pull request review.

**Dependencies:** Phases 2, 6, and 7.

**Deliverables**

- Persistent compact widget and expandable reference-matched tomato dial
- Large red tomato, green leaves, pale peach tick-mark ring, centered white
  minute display, and the reference layout for mode selection, slider, and
  controls
- Focus, Short Break, and Long Break modes
- Start, Pause, Resume, Reset, horizontal slider, direct dial rotation, and
  accessible duration controls
- Timestamp-based countdown reconciliation
- Completion rules, automatic mode selection, optional auto-start
- Clockwise rotation increases duration and counterclockwise rotation decreases
  duration; the slider and dial update the same current-session value
- Confirmed behavior for manually switching modes during running or paused
  sessions
- Completed Focus-session and focus-time statistics
- Optional sound and notification behavior with explicit permission handling

**Acceptance criteria**

- Manual duration changes affect only the current session.
- A completed Focus session counts once, including when manually adjusted.
- Paused, reset, abandoned, or interrupted sessions do not count.
- A running Focus session whose persisted end timestamp has passed is recorded
  exactly once, including after the application was closed.
- Refresh, navigation, inactive tabs, and reopen behavior reconcile from
  timestamps.
- Four completed Focus sessions select Long Break; otherwise Short Break.
- Completing Long Break resets the Focus cycle counter.
- Slider or dial input cannot accidentally change the duration of an active
  countdown.
- Switching modes during a running or paused session requires confirmation;
  confirming abandons the incomplete session, selects the new mode's saved
  default, and does not auto-start it, while cancelling preserves the current
  session.
- Auto-switch remains enabled by default.
- Auto-start remains disabled by default.
- Timer controls do not overlap the Add button or core content.

**Verification**

- Unit-test timer state transitions with fake time, completion, pause/resume,
  reset, mode selection, manual mode switching, exactly-once completion, and
  recovery cases.
- Add Playwright coverage for navigation during a session and reopen recovery.
- Test slider/dial duration parity, reduced motion, and the non-drag duration
  control.
- Test notification-denied and unsupported-browser fallbacks.

### Phase 9 — Complete JSON backup and restore

**Suggested branch:** `feat/json-backup-restore`

**Dependencies:** Phases 2–8.

**Deliverables**

- Extend the Phase 2 versioned JSON export into the complete backup workflow;
  do not introduce a second data format
- Import parsing, schema validation, summary, confirmation, and replacement
- Invalid-backup rejection without mutating current data
- Export reminder before replacement
- Clear-all-data confirmation

**Acceptance criteria**

- An exported backup can restore categories, topics, entries, settings, and
  relevant statistics without silent loss.
- Invalid or unsupported files leave existing data untouched.
- Replacement happens only after explicit confirmation.
- Clear-all-data cannot be triggered accidentally.

**Verification**

- Unit-test round trips, malformed files, unsupported versions, duplicate IDs,
  and invalid relationships.
- Add Playwright coverage for valid import, rejected import, and cancellation.
- Manually inspect a sample exported file without treating it as a fixture for
  unimplemented behavior.

### Phase 10 — Local PDF export

**Suggested branch:** `feat/local-pdf-export`

**Dependencies:** Phases 3–4 and 9.

**Deliverables**

- Export a topic, category, or all content
- Questions Only and Questions with Answers formats
- Local generation with titles, context, wrapping, and page breaks
- Clear handling for empty selections and generation failures

**Acceptance criteria**

- All requested scopes produce readable PDFs without uploading data.
- Questions-only exports contain no answers.
- Questions-with-answers exports preserve question/answer association.
- PDF generation works without internet access.

**Verification**

- Unit-test scope selection and output-content rules.
- Run an offline browser test for each scope and format.
- Render representative PDFs and inspect page breaks, wrapping, and long text.

### Phase 11 — Offline packaging and release hardening

**Suggested branch:** `feat/offline-pwa-shell`

**Dependencies:** Phases 1–10.

**Deliverables**

- Production manifest and service worker
- Cache policy for the application shell and local assets
- Installability guidance and offline fallback
- No remote fonts or core network dependencies
- Final responsive, accessibility, storage, import/export, and timer pass

**Acceptance criteria**

- After an initial successful load/install, core study flows work offline.
- Refreshing an installed app offline loads the shell and local data.
- An unavailable network does not block JSON or PDF operations.
- Cache updates do not silently erase browser-local study data.

**Verification**

- Run a production build and Playwright offline-context tests.
- Inspect the manifest and service-worker cache behavior.
- Test an upgrade path from an earlier schema and application version.
- Perform a final keyboard, reduced-motion, contrast, and mobile review.

## Optional enhancements after MVP

These are intentionally outside the first implementation sequence:

- IndexedDB adapter when measured storage needs justify it
- More detailed personal analytics beyond the required dashboard counts
- Additional PDF layout themes
- More timer sounds or notification customization
- Import merge tools after replacement restore is reliable
- Study history or spaced-repetition features, only with a separately approved
  product decision

Do not begin these enhancements while an essential phase has unresolved data
integrity, accessibility, offline, or backup issues.

## Pull-request and release checkpoints

Each phase should normally produce one focused pull request containing:

- A concise Summary, Changes, and Validation section
- Tests appropriate to the behavior added
- Documentation updates when behavior or decisions change
- No unrelated refactors, dependencies, or generated artifacts

Before calling the MVP complete, verify the full essential phase acceptance
criteria, run the available unit and end-to-end suites, test the production
offline path, and record any unresolved decisions instead of presenting them
as completed behavior.
