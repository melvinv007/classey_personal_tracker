# Classey Codebase Context

Last generated: 2026-05-15

This document is a practical map of the Classey project. It explains what the app does, how the folders fit together, what each meaningful source file is responsible for, and the important implementation details future work should respect.

Sensitive values from `.env.local` are intentionally not copied here. Only the shape and purpose of environment variables are documented.

## Project Summary

Classey is a personal student tracker built with Next.js App Router, React, TypeScript, Tailwind CSS, Appwrite, TanStack Query, Zustand, Framer Motion, FullCalendar, Recharts, AI SDK providers, and Telegram notifications.

The app tracks semesters, subjects, class schedules, attendance, exams, tasks, personal events, files, resource links, notes, grade calculations, AI assistance, and reminders. Appwrite is the primary backend for database and storage. The UI is a glassmorphism dashboard with a dock, animated backgrounds, command search, modals, and mobile-friendly layouts.

## Next.js Version Notes

The project instruction in `AGENTS.md` says this is not the usual Next.js API surface and points future agents to `node_modules/next/dist/docs/`. The installed version is Next `16.2.2`.

Important local Next 16 conventions verified from the installed docs:

- The App Router lives under `src/app`.
- A top-level `proxy.ts` file is the current convention replacing older middleware naming.
- Route handlers are implemented through `route.ts` files.
- Dynamic route handler params may be asynchronous, so API routes such as file view and download correctly await params.
- `next dev` uses Turbopack by default in Next 16.
- `next lint` is removed; this project exposes linting through the `lint` package script.

## Runtime And Scripts

`package.json` defines the main commands:

- `pnpm dev`: starts Next development server.
- `pnpm build`: builds the app.
- `pnpm start`: starts the production server.
- `pnpm lint`: runs ESLint.

Main dependencies:

- `next`, `react`, `react-dom`: framework and UI runtime.
- `typescript`: strict type checking.
- `tailwindcss` and `@tailwindcss/postcss`: Tailwind 4 styling.
- `appwrite` and `node-appwrite`: browser and server Appwrite SDKs.
- `@tanstack/react-query`: query cache and server-state mutations.
- `zustand`: local persisted and in-memory UI state.
- `framer-motion`: animation.
- `@fullcalendar/*`: calendar page rendering.
- `recharts`: analytics charts.
- `@ai-sdk/google`, `@ai-sdk/groq`, `ai`: AI assistant integrations.
- `lucide-react`: icon set.
- `react-hook-form`, `zod`: form state and validation.
- `sonner`: toast notifications.
- `date-fns`: date formatting and calculations.
- `cmdk`, `fuse.js`: command palette and fuzzy search.
- `html2canvas`, `jspdf`: client-side export utilities.

## Top-Level Files And Folders

### Folders

- `.agents/`: Codex agent skills local to this repo. Contains Appwrite CLI and Appwrite TypeScript SDK guidance.
- `.claude/`: Claude-specific local configuration. The `skills` folder is currently empty.
- `.git/`: Git repository metadata. Do not edit manually.
- `.github/`: GitHub workflow, old Copilot instructions, reusable prompts, and project skills.
- `.next/`: generated Next build and dev output. Do not edit.
- `.vscode/`: editor settings for VS Code.
- `node_modules/`: installed dependencies. Do not edit.
- `public/`: static assets and PWA manifest.
- `scripts/`: project setup scripts, especially Appwrite schema setup.
- `src/`: application source code.

### Root Files

- `.env.example`: template for required environment variables.
- `.env.local`: local secrets and runtime config. It is gitignored and should not be copied into docs or commits.
- `.gitignore`: excludes dependencies, build output, local env files, Appwrite check output, local assistant folders, SQLite files, and scratch files.
- `AGENTS.md`: local instruction file. Its key rule is to read installed Next docs before coding because the installed Next version has breaking changes.
- `appwrite-schema-check.txt`: captured Appwrite schema state from a real project. Useful for checking actual deployed attributes against runtime expectations.
- `appwrite.config.json`: Appwrite project configuration with endpoint and project id.
- `CLAUDE.md`: delegates to `AGENTS.md`.
- `components.json`: shadcn/ui style config with aliases, Tailwind CSS path, RSC enabled, and lucide icons.
- `COPILOT_CONTEXT.md`: older project context and progress notes. Useful but partly stale because the app has moved to newer Next and Appwrite patterns.
- `eslint.config.mjs`: ESLint flat config using Next core-web-vitals and TypeScript rules.
- `next-env.d.ts`: generated Next TypeScript declarations.
- `next.config.ts`: Next configuration. Enables React strict mode, optimizes imports for `lucide-react` and `date-fns`, and sets `proxyClientMaxBodySize` to 100 MB.
- `package.json`: dependencies, package manager, and scripts.
- `pnpm-lock.yaml`: lockfile for exact dependency versions.
- `pnpm-workspace.yaml`: workspace settings, including ignored built dependencies.
- `postcss.config.mjs`: Tailwind 4 PostCSS plugin config.
- `prompt.txt`: empty scratch prompt file.
- `README.md`: default create-next-app README and currently not a complete project guide.
- `SETUP_GUIDE.md`: setup instructions for environment, Appwrite, Telegram, and deployment. Some details may be stale compared with current code.
- `testing.md`: manual QA checklist.
- `tsconfig.json`: strict TypeScript config, bundler module resolution, React JSX runtime, and `@/*` alias to `src/*`.

## Environment Variables

The app expects environment variables for authentication, Appwrite, AI providers, Telegram, and deployment URL.

Important groups:

- Password gate: `APP_PASSWORD`, `AUTH_COOKIE_SECRET`.
- Appwrite public config: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, `NEXT_PUBLIC_APPWRITE_DATABASE_ID`, `NEXT_PUBLIC_APPWRITE_BUCKET_ID`.
- Appwrite collection ids: many `NEXT_PUBLIC_COL_*` variables. The code falls back to literal collection names such as `settings`, `semesters`, and `subjects` when these are absent.
- Appwrite server access: `APPWRITE_API_KEY`.
- AI providers: `GROQ_API_KEY`, `GOOGLE_AI_API_KEY`.
- Telegram: `TELEGRAM_BOT_TOKEN`.
- App URL: `NEXT_PUBLIC_APP_URL`.
- Runtime: `NODE_ENV`.

Never expose `.env.local` values in documentation or commits.

## Source Tree Overview

`src` is divided into App Router routes, shared components, hooks, libraries, stores, types, and utilities.

- `src/app/`: pages, layouts, route groups, API route handlers, and global CSS.
- `src/components/`: reusable UI, layout, cards, modals, background effects, calendar views, providers, forms, and common states.
- `src/hooks/`: TanStack Query hooks and data facade hooks.
- `src/lib/`: Appwrite clients and services, storage helpers, AI helpers, Telegram helpers, semester status logic, shared utilities, and legacy mock data.
- `src/stores/`: Zustand stores for theme, undo, AI entities, active semester, legacy data, and notification preferences.
- `src/types/`: TypeScript data model definitions.
- `src/utils/`: domain utilities for attendance, grades, slots, and exports.
- `src/proxy.ts`: password-gate proxy for protected routes.

## App Router Files

### Global App Files

- `src/app/layout.tsx`: root layout. Loads Google fonts, declares metadata, viewport settings, theme pre-hydration script, PWA icon metadata, and wraps the app in `Providers`.
- `src/app/globals.css`: global Tailwind and theme CSS. Defines light and dark CSS variables, accent variables, glass styles, UI-style variants, scrollbar styles, form control theming, utility classes, animations, and day-picker styling.
- `src/app/icon.png`: app icon used by Next metadata.
- `src/app/favicon.ico`: favicon.

### Authentication Group

- `src/app/(auth)/layout.tsx`: minimal layout wrapper for authentication pages.
- `src/app/(auth)/login/page.tsx`: client-side password login. Checks existing session with `GET /api/auth`, submits password to `POST /api/auth`, handles redirect query param, and renders a glass login panel over `DynamicBackground`.

### Dashboard Group

- `src/app/(dashboard)/layout.tsx`: authenticated dashboard shell. Renders `SkipToContent`, animated background, `Dock`, `AIBubble`, `GlobalSearch`, and the main content wrapper.
- `src/app/(dashboard)/loading.tsx`: route-level loading state using `PageSkeleton`.
- `src/app/(dashboard)/error.tsx`: client error boundary page with reset and home actions.
- `src/app/(dashboard)/not-found.tsx`: dashboard 404 screen with back and home actions.
- `src/app/(dashboard)/page.tsx`: main dashboard. Shows active semester selection, today's classes, attendance controls, pending attendance suggestions, free-time gaps, tasks, semester cards, archive visibility, no-class periods, holiday modal, extra class modal, and attendance occurrence creation.

### Dashboard Feature Pages

- `src/app/(dashboard)/tasks/page.tsx`: task manager. Filters tasks by all, pending, overdue, and completed; sorts tasks; creates, edits, deletes, toggles completion, and clears completed tasks with undo support.
- `src/app/(dashboard)/timetable/page.tsx`: weekly timetable. Converts active semester schedules to calendar grid events, supports week navigation, creates personal events from empty cells, and opens subjects from class events.
- `src/app/(dashboard)/calendar/page.tsx`: FullCalendar month/week/list calendar. Combines class schedules, exams, and personal events, omits classes during no-class periods or cancelled occurrences, and routes class/exam clicks to subject context.
- `src/app/(dashboard)/calendar/calendar.css`: FullCalendar skin customized for the glass UI and multiple UI-style variants.
- `src/app/(dashboard)/files/page.tsx`: file library. Supports active-semester/global scope, search, file type filters, past-paper filters, subject filters, grouped display, task attachments, upload, view, download, and delete.
- `src/app/(dashboard)/settings/page.tsx`: settings screen. Appearance tab manages theme mode, UI style, background, accent, font, calendar/timetable weekend display, timetable hour height, and column width. Notifications tab manages Telegram verification, tests, disconnect, reminder defaults, notification toggles, class timing, delete-all danger zone, and logout.
- `src/app/(dashboard)/analytics/cgpa/page.tsx`: CGPA analytics. Resolves semester grade data, shows completed/current/ongoing-inclusive CGPA, renders line chart and breakdown, and includes SPI and target-CGPA what-if calculators.
- `src/app/(dashboard)/tools/attendance-calculator/page.tsx`: bunk and attendance calculator. Works with current semester or selected subject, supports remaining-class overrides, custom scenarios, attend-all/miss-all projections, and safe-bunk calculations.

### Dynamic Semester And Subject Pages

- `src/app/(dashboard)/semester/[id]/page.tsx`: semester detail. Shows semester stats, subject cards, add/edit semester and subjects, delete subject/semester flows, semester notepad, holiday/no-class periods, exam-time periods, extra class creation, and mark-all-present-today actions.
- `src/app/(dashboard)/semester/[id]/subject/[subjectId]/page.tsx`: subject detail. Contains subject header, attendance ring, stats, expected attendance rows, auto-absent setting, today's attendance controls, manual schedule form, tasks, exams, files, resource links, notes, subject notepad, attendance history editing, file upload, link and note creation, exam marks editing, task completion, and subject cascade deletion.

## Route Protection

- `src/proxy.ts`: protects dashboard and app routes using the `classey-auth` cookie. Public routes include `/login`, `/api/auth`, and `/api/telegram`. Static Next assets, icons, manifest, and public image files are excluded. The auth token is derived from `APP_PASSWORD` and `AUTH_COOKIE_SECRET` with a simple hash helper. Unauthenticated users are redirected to `/login?redirect=...`.

## API Routes

- `src/app/api/auth/route.ts`: password-gate API. `GET` checks auth cookie, `POST` validates password and sets a 30-day `classey-auth` cookie, and `DELETE` clears the cookie.
- `src/app/api/ai/route.ts`: AI assistant API. Validates messages, checks daily AI usage limits from settings, gathers current semester context from Appwrite, calls the AI helper, increments usage, and returns message, entity action, provider, tokens, and remaining daily usage. `GET` reports usage status.
- `src/app/api/telegram/route.ts`: Telegram helper API. Supports `send`, `verify`, and `test` actions, can log dedupe entries in `notifications_log`, and `GET` reports whether the bot token is configured.
- `src/app/api/telegram/scheduler/route.ts`: reminder scheduler API. Handles `run-due`, `sync-entity`, `sync-all`, and `clear-entity`; validates scheduler secret for privileged actions; converts Appwrite docs; schedules reminder jobs for tasks and exams; processes due notifications with dedupe, retries, and backoff.
- `src/app/api/data/cascade/route.ts`: server-side cascade deletes. Supports `delete-subject`, `delete-semester`, and `delete-all`, deleting dependent schedules, occurrences, exams, tasks, events, files, resource links, notes, holidays, and Appwrite storage files.
- `src/app/api/files/upload/route.ts`: server-side upload. Validates file type and 100 MB size, checks linked entity consistency, uploads to Appwrite Storage, creates the `files` database document, and rolls back storage if database write fails.
- `src/app/api/files/delete/route.ts`: server-side delete. Deletes the Appwrite Storage object and soft-deletes the matching `files` document.
- `src/app/api/files/download/[storageFileId]/route.ts`: private download endpoint. Fetches Appwrite file bytes and metadata, returns them as an attachment with cache headers.
- `src/app/api/files/view/[storageFileId]/route.ts`: private inline file view endpoint. Fetches Appwrite file bytes and metadata, returns them inline with cache headers.

## Data Model

- `src/types/database.ts`: central TypeScript model file. Defines Appwrite documents and domain interfaces for `Semester`, `Subject`, `Slot`, `SubSlot`, `ClassSchedule`, `ClassOccurrence`, `Exam`, `Task`, `Event`, `Holiday`, `GradeMapping`, `GradeScale`, `Settings`, `NotificationLog`, `ReminderOffset`, `AttendanceStats`, `ClasseyFile`, `ResourceLink`, `Note`, and `AiConversation`.

Important model conventions:

- Most user data has `deleted_at` for soft delete.
- Settings are stored in a singleton-like `settings` collection record.
- Reminder offsets are stored as JSON strings in Appwrite but exposed as arrays in code.
- Some Appwrite attributes may be absent in older deployed schemas, so runtime services include fallbacks and adaptive payload filtering.
- `parseGradeMappings` and `parseSubSlots` safely convert JSON strings into typed arrays.

## Appwrite And Data Access

- `src/lib/appwrite.ts`: browser Appwrite client singleton. Exports `account`, `databases`, `storage`, `DATABASE_ID`, `BUCKET_ID`, `ID`, `Query`, and `COLLECTIONS`. Collection ids come from env vars with literal fallbacks.
- `src/lib/appwrite-server.ts`: server Appwrite client using `node-appwrite` and `APPWRITE_API_KEY`. Exports server `databases`, `storage`, `users`, constants, and collection ids.
- `src/lib/appwrite-db.ts`: main database service layer. Provides generic CRUD helpers plus collection-specific services for semesters, subjects, schedules, slots, occurrences, exams, tasks, settings, holidays, notifications, events, files, resource links, and notes.
- `src/lib/appwrite-storage.ts`: file validation and storage helper layer. Defines allowed extensions, max 100 MB upload size, category detection, upload through `/api/files/upload`, delete through `/api/files/delete`, direct download/view URLs, preview URLs, and file size formatting.

Important `appwrite-db.ts` details:

- `listDocuments`, `getDocument`, `createDocument`, `updateDocument`, `softDeleteDocument`, `restoreDocument`, and `deleteDocument` are generic helpers.
- Most list services filter out soft-deleted records.
- `classOccurrenceService` supports hard delete and attendance marking.
- `examService` and `taskService` serialize reminder offsets and expose typed arrays.
- `settingsService` creates, reads, and updates settings while adapting to unknown or missing attributes.
- `holidayService` handles schema drift for optional holiday fields.
- `subjectService` normalizes slot id storage and sub-slot data.

## Hooks

- `src/hooks/use-appwrite.ts`: TanStack Query integration for all Appwrite collections. Defines query keys, fetch hooks, mutation hooks, cache invalidation, settings bootstrap, reminder sync side effects for tasks and exams, holiday invalidation, and file/link/note operations.
- `src/hooks/use-data.ts`: compatibility facade over the query hooks. Aggregates all app data, derives active/current/ongoing/archived semesters, exposes CRUD helpers, computes attendance stats, wraps reminder offset helpers, and provides a single `refetch`.
- `src/hooks/use-timetable-weekend-setting.ts`: localStorage-backed hooks using `useSyncExternalStore` for UI preferences: calendar weekend visibility, timetable weekend visibility, timetable hour row height, and timetable column minimum width.
- `src/hooks/index.ts`: barrel exports for `useData` and Appwrite hooks.

## State Stores

- `src/stores/theme-store.ts`: persisted visual settings store. Tracks theme mode, background style, UI glass style, font family, accent color, display names, validation guards, and serialization/parsing for custom CSS settings.
- `src/stores/undo-store.ts`: in-memory undo action queue. Provides a 5-second undo window and Sonner toast integration for soft deletes, task completion, and attendance changes.
- `src/stores/ai-entity-store.ts`: holds pending AI-created entity actions, lets pages consume or clear them, and extracts default values from AI output.
- `src/stores/semester-store.ts`: persists the active semester id.
- `src/stores/notification-store.ts`: legacy/mock persisted notification preference store. The current production settings flow primarily uses Appwrite settings.
- `src/stores/data-store.ts`: legacy/mock local-data Zustand store backed by `src/lib/mock-data.ts`. It contains local CRUD and attendance recalculation logic and is useful for development reference, but the main app now uses Appwrite hooks.

## Shared Libraries

- `src/lib/ai.ts`: AI helper. Supports Groq first and Google fallback, applies a daily limit of 50 messages by IST date, builds a context-rich system prompt from semester data, parses JSON entity actions, provides quick prompts, and includes markdown formatting helpers.
- `src/lib/telegram.ts`: Telegram helper. Sends and verifies bot messages and formats exam, assignment, task, class, attendance warning, and daily summary notifications.
- `src/lib/semester-status.ts`: display status logic for semesters. Resolves `upcoming`, `ongoing`, `over`, and `completed` using explicit status, SPI, subject grades, and date range.
- `src/lib/utils.ts`: generic helpers including `cn`, hex/rgb conversion, accent CSS variables, number formatting, capitalization, short day names, truncation, delay, client/server checks, and time normalization.
- `src/lib/mock-data.ts`: legacy/demo dataset for semesters, subjects, slots, schedules, occurrences, exams, tasks, events, files, resource links, and notes.

## Domain Utilities

- `src/utils/attendance.ts`: attendance math. Calculates percentages, required classes, safe bunk counts, attend-all/miss-all projections, remaining-class estimates, status labels, color classes, and formatted percentages.
- `src/utils/grades.ts`: grade and CGPA math. Defines default grade scale, grade from percentage, subject grade calculation, SPI/CGPA calculations, quick-input/manual semester resolution, what-if CGPA, required SPI, marks-needed estimates, and grade colors.
- `src/utils/slots.ts`: timetable slot helpers. Defines day constants, parses sub-slots, formats time ranges, generates class schedules from slots, checks overlaps and conflicts, calculates durations, sorts schedules, groups by day, and counts classes per week.
- `src/utils/export.ts`: client export helpers. Exports JSON data, semester PDF, attendance PDF, and timetable image/PDF through dynamic `jspdf` and `html2canvas` imports.

## Providers And Common Components

- `src/components/providers/index.tsx`: root provider composition. Wraps children in `QueryProvider`, `ThemeProvider`, and a glass-styled Sonner `Toaster`.
- `src/components/providers/QueryProvider.tsx`: creates a React Query client with 5-minute stale time, 30-minute garbage collection, retry count 2, and no focus refetch.
- `src/components/providers/ThemeProvider.tsx`: applies theme mode, accent, font, background, and UI style to the DOM, syncs from Appwrite settings, and exports `themeScript` for pre-hydration.
- `src/components/common/ErrorBoundary.tsx`: class-based React error boundary with fallback UI and reset button.
- `src/components/common/Skeleton.tsx`: base skeleton plus card, semester, subject, list, table, and page skeletons.
- `src/components/common/EmptyState.tsx`: reusable empty states including no semesters, subjects, exams, tasks, files, search results, and attendance.
- `src/components/common/SkipToContent.tsx`: accessibility skip link.
- `src/components/common/index.ts`: common component barrel.

## Layout Components

- `src/components/layout/Dock.tsx`: fixed desktop side dock and mobile bottom dock. Provides navigation to dashboard, calendar, timetable, tasks, files, analytics, and settings.
- `src/components/layout/AIBubble.tsx`: floating AI assistant. Fetches usage status, sends messages to `/api/ai`, displays provider and remaining count, exposes quick prompts, and stores generated entity actions.
- `src/components/layout/BackButton.tsx`: reusable router back or href button.
- `src/components/layout/index.ts`: layout component barrel.

## Search

- `src/components/global/GlobalSearch.tsx`: global command palette. Uses Cmd/Ctrl+K, `cmdk`, and `Fuse` to search navigation pages, semesters, subjects, exams, pending tasks, and files. Exports `SearchTrigger`.

## Card Components

- `src/components/cards/SemesterCard.tsx`: animated semester card showing status, dates, progress, subject count, stats, context menu actions, archive/edit/holiday/analytics/delete controls.
- `src/components/cards/SubjectCard.tsx`: subject card with attendance ring, type, teacher, next class, and context menu actions.
- `src/components/cards/ExamCard.tsx`: exam display with date, time, urgency, marks, percentage, and weightage.
- `src/components/cards/TaskCard.tsx`: task display with priority, deadline/overdue state, subject color, and completion toggle.
- `src/components/cards/EventCard.tsx`: personal event display with recurrence, all-day state, location, and time status.
- `src/components/cards/index.ts`: card component barrel.

## Calendar Components

- `src/components/calendar/types.ts`: shared `CalendarGridEventType` and `CalendarGridEvent` types.
- `src/components/calendar/MonthGridView.tsx`: custom month grid with event chips, day expansion, selected date support, and event click handling.
- `src/components/calendar/TimeGridView.tsx`: 24-hour time grid with all-day row, current-time line, overlapping event columns, click-to-create cells, week/weekend behavior, and responsive layout.

## Background Components

- `src/components/backgrounds/index.tsx`: exports background components and maps the selected `BackgroundStyle` to the correct component through `DynamicBackground`.
- `src/components/backgrounds/SpookySmokeBackground.tsx`: canvas smoke animation with reduced-motion and mobile throttling.
- `src/components/backgrounds/AnimatedGridBackground.tsx`: animated grid, mesh, and constellation-style background.
- `src/components/backgrounds/DottedBackground.tsx`: dotted visual background.
- `src/components/backgrounds/DotPatternBackground.tsx`: dot pattern background.
- `src/components/backgrounds/BoxesBackground.tsx`: animated box grid background.
- `src/components/backgrounds/AuroraBackground.tsx`: aurora-style animated background.
- `src/components/backgrounds/BeamsBackground.tsx`: moving beam background.
- `src/components/backgrounds/MeshGradientBackground.tsx`: mesh gradient background.
- `src/components/backgrounds/NoiseGridBackground.tsx`: noise plus grid background.
- `src/components/backgrounds/StarfieldBackground.tsx`: animated starfield background.
- `src/components/backgrounds/SpiralBloomBackground.tsx`: spiral bloom background.
- `src/components/backgrounds/MeteorShowerBackground.tsx`: meteor shower background.

## UI And Form Components

- `src/components/ui/ContextMenu.tsx`: custom context menu with right-click and long-press support, viewport clamping, click-outside handling, escape key handling, and Framer Motion animations.
- `src/components/ui/PersistentNotepad.tsx`: localStorage-backed notepad with a saved-time label, scoped by storage key.
- `src/components/ui/ThemedColorPicker.tsx`: Radix popover color picker with preset swatches, HSV panel, hue slider, and hex input.
- `src/components/ui/ThemedDateTimeInput.tsx`: themed date, time, and datetime inputs. Uses calendar popovers and spin-style time selection.
- `src/components/ui/ThemedSelect.tsx`: Radix select styled to match the glass UI.
- `src/components/forms/ReminderOffsetsEditor.tsx`: editor for reminder offsets. Supports minutes, hours, and days with add/remove behavior.

## Modal Components

- `src/components/modals/CreateSemesterModal.tsx`: creates semesters with validation, dates, color, status, and optional quick-input SPI/credits. Can update accent for ongoing semester.
- `src/components/modals/EditSemesterModal.tsx`: edits semester fields, status, quick-input data, and provides delete confirmation.
- `src/components/modals/SemesterHolidaysModal.tsx`: manages semester no-class periods and holidays with date range validation and description encoding.
- `src/components/modals/CreateSubjectModal.tsx`: creates subjects with type, grade points, date range, color, attendance settings, teacher, and either slot-based or manual schedules.
- `src/components/modals/EditSubjectModal.tsx`: edits subject fields and schedules, supports manual/slot schedule additions, schedule removal, and delete confirmation.
- `src/components/modals/AddExtraClassModal.tsx`: creates one-off extra class occurrences.
- `src/components/modals/EditAttendanceHistoryModal.tsx`: bulk and per-occurrence attendance editing for present, absent, and cancelled statuses, with save/delete behavior.
- `src/components/modals/CreateTaskModal.tsx`: creates tasks with subject, deadline, priority, description, reminder offsets, and optional file attachments uploaded after task creation.
- `src/components/modals/EditTaskModal.tsx`: edits task fields and reminder offsets.
- `src/components/modals/CreateExamModal.tsx`: creates exams with type, date, time, duration, location, marks, weightage, syllabus, notes, and reminder offsets.
- `src/components/modals/EditExamMarksModal.tsx`: edits exam marks and reminders, shows percent and grade feedback, and supports clear/full marks.
- `src/components/modals/CreateEventModal.tsx`: creates personal events with all-day or timed range, location, recurrence, color, and optional semester.
- `src/components/modals/UploadFileModal.tsx`: drag/drop file upload modal with validation, rename, link-to-entity, past-paper flag, description, and upload status.
- `src/components/modals/AddResourceLinkModal.tsx`: creates resource links and auto-detects common providers such as YouTube, Notion, Drive, GitHub, and website.
- `src/components/modals/AddNoteModal.tsx`: creates notes attached to subjects or attendance occurrences, with optional pinning.
- `src/components/modals/ConfirmActionModal.tsx`: generic confirmation and danger modal.
- `src/components/modals/GradeCalculatorModal.tsx`: subject grade requirement calculator based on completed and remaining exams.
- `src/components/modals/index.ts`: modal component barrel.

## Main Feature Flows

### Authentication

The whole app is protected by a simple password gate. `src/proxy.ts` checks the `classey-auth` cookie for protected routes. The login page calls `/api/auth`; successful login sets the cookie for 30 days.

### Semesters And Subjects

Semesters group subjects, schedules, exams, tasks, files, events, holidays, links, and notes. The dashboard derives an active semester from persisted active semester id, current date, and available ongoing semesters. Subject pages are the densest feature area because attendance, schedules, grades, tasks, exams, files, links, and notes all converge there.

### Attendance

Attendance is based on schedules and class occurrences. Scheduled classes can have explicit occurrence records, and the subject page can also derive expected rows for scheduled classes without records. Holidays and no-class periods cancel matching classes. Extra classes are represented as occurrences with extra-class metadata.

### No-Class Periods

Semester-level holidays/no-class periods are stored in the `holidays` collection. Some period metadata is encoded in `description`, including semester association and notes. Creating or updating no-class periods can create matching cancelled occurrences; deleting periods removes tagged cancellation occurrences.

### Tasks And Exams

Tasks and exams support reminders through reminder offset JSON. Create/update/delete operations trigger `/api/telegram/scheduler` to sync or clear queued reminder notifications.

### Files

Files are uploaded through server routes, not direct browser SDK writes. A file can link to subject, task, exam, event, class occurrence, or be general. The file library derives semester scope by walking those linkages. Deletes remove storage data and soft-delete file documents.

### AI Assistant

The floating AI bubble sends messages to `/api/ai`. The API builds a student-context prompt from Appwrite data, enforces a daily limit, uses Groq with Google fallback, and can return structured entity actions for app pages to consume.

### Telegram Reminders

Telegram reminders use a queue in `notifications_log`. The scheduler route queues reminders from tasks and exams and processes due jobs. A GitHub Actions workflow calls the scheduler endpoint every minute using a secret header.

### Appearance

Theme settings are stored in Appwrite settings and mirrored to the DOM by `ThemeProvider`. UI style, background, accent, and font are also available through `theme-store`. Calendar/timetable layout settings use localStorage hooks.

## Appwrite Schema And Setup

- `scripts/setup-appwrite.ts`: creates 23 collections and seeds default slots. It uses `node-appwrite`, reads `.env.local`, defines attributes/indexes/permissions, and creates default timetable slots if the slots collection is empty.
- `appwrite-schema-check.txt`: snapshot of actual deployed schema. It confirms collections and attributes, and shows places where runtime code expects fields that may not exist in the older deployed schema.

Important schema note:

The setup script, runtime code, and captured deployed schema are not perfectly identical. Runtime code has defensive behavior for missing or unknown attributes, especially in settings, holidays, notifications, and reminder fields. Future schema work should compare all three sources before changing database code.

## GitHub And Assistant Assets

### Workflow

- `.github/workflows/telegram-scheduler.yml`: scheduled GitHub Action that runs every minute and manually on demand. It calls the production scheduler endpoint with `x-scheduler-token` and action `run-due`.

### Old Instructions

- `.github/old.copilot-instructions.md`: older project instructions for Copilot. It includes architecture, UI rules, database rules, and examples, but some details are stale.

### Prompts

- `.github/prompts/create-hook.prompt.md`: template for creating Appwrite TanStack Query hooks.
- `.github/prompts/appwrite-collection.prompt.md`: template for adding a new Appwrite collection, types, validation, hooks, and env entries.
- `.github/prompts/create-component.prompt.md`: template for glassmorphism components.
- `.github/prompts/create-page.prompt.md`: template for page scaffolding.
- `.github/prompts/create-modal.prompt.md`: template for modal creation.
- `.github/prompts/create-store.prompt.md`: template for Zustand stores.
- `.github/prompts/ui-review.prompt.md`: UI review checklist.
- `.github/prompts/ai-feature.prompt.md`: AI feature implementation template.

### Skills

- `.github/skills/classey-database/SKILL.md`: collection specs, Appwrite query/storage rules, and database implementation guidance.
- `.github/skills/classey-features/SKILL.md`: detailed feature behavior and formulas for attendance, grades, reminders, files, and analytics.
- `.github/skills/classey-screens/SKILL.md`: intended screen and route map. It includes some future or unimplemented route ideas, so verify against `src/app`.
- `.github/skills/classey-ui/SKILL.md`: Classey visual system, glass UI rules, animation principles, and responsive guidance.
- `.github/skills/premium-frontend-ui/SKILL.md`: general premium UI guidance.
- `.github/skills/se-ux-ui-designer/SKILL.md`: UX research and journey mapping guidance.
- `.agents/skills/appwrite-cli/SKILL.md`: command-line Appwrite workflow reference.
- `.agents/skills/appwrite-typescript/SKILL.md`: Appwrite TypeScript SDK reference. It mentions newer Appwrite TablesDB concepts, but this codebase currently uses Appwrite Databases APIs.

## Public Assets

- `public/manifest.json`: PWA manifest for Classey, standalone display, portrait orientation, theme/background colors, and app icons.
- `public/apple-touch-icon.png`: Apple touch icon.
- `public/favicon-16x16.png`: small favicon.
- `public/favicon-32x32.png`: larger favicon.
- `public/favicon.ico`: favicon.
- `public/icon-192.png`: PWA icon.
- `public/icon-512.png`: PWA icon.
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg`: default starter SVG assets.

## Generated Or Vendor Content

- `node_modules/`: dependency source. Do not modify.
- `.next/`: generated by Next builds and dev server. Do not modify.
- `.git/`: repository internals. Do not modify.
- `pnpm-lock.yaml`: generated dependency lockfile. Edit only through dependency operations.
- `next-env.d.ts`: generated Next type declarations.

## Current Documentation State

- `README.md` is still the default create-next-app README and does not describe the actual product.
- `SETUP_GUIDE.md` is useful for setup but has some details that may not match current code, such as older file-size notes.
- `COPILOT_CONTEXT.md` is a progress and architecture log. It is helpful but partly stale.
- `testing.md` is a manual QA checklist.
- This `CONTEXT.md` is the broad codebase map and should be updated when routes, collections, or major flows change.

## Known Caveats For Future Work

- Do not assume every route described in `.github/skills/classey-screens/SKILL.md` is implemented. Check `src/app` first.
- Do not expose `.env.local` values.
- Compare `scripts/setup-appwrite.ts`, `appwrite-schema-check.txt`, and runtime services before changing Appwrite schema assumptions.
- Prefer Appwrite service helpers and existing hooks over direct database calls in pages.
- Keep reminder sync side effects for task and exam mutations intact.
- Preserve soft-delete behavior unless intentionally doing cascade hard deletes through the server API.
- Treat `data-store.ts`, `notification-store.ts`, and `mock-data.ts` as legacy or development support unless a page explicitly imports them.
- For Next changes, read the installed docs under `node_modules/next/dist/docs/` first, because this repo intentionally warns about breaking changes from older Next versions.
- UI work should follow the existing glassmorphism system, accent variables, animated backgrounds, and modal/card conventions instead of introducing a separate design language.
