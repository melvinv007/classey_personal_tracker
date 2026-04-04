# Classey — GitHub Copilot Instructions
# ALWAYS read this file completely before generating any code.

---

## 🎯 Project Overview

**App Name:** Classey
**Tagline:** University Life Tracker
**Type:** Responsive web application (desktop + mobile browser, NOT a native app)
**Status:** Active development
**Owner GitHub:** melvinv007
**Deployment:** Vercel → https://classey.vercel.app (placeholder)
**Repository root:** Final-tracker-app/classey/

Classey is a comprehensive university life tracker for managing semesters, classes,
attendance, exams, tasks, and personal events. It is a single-user app (only the
owner uses it) protected by an environment variable password. It has a beautiful,
dynamic, highly customizable UI with dark mode as default.

---

## 🚫 CRITICAL — READ BEFORE GENERATING ANY UI

1. NEVER generate AI-looking, generic, or flat UI. Every component must feel
   handcrafted and intentional.
2. NEVER use default shadcn/ui styling without customization.
3. NEVER hardcode colors — always use CSS variables tied to the semester accent
   color system.
4. NEVER create a component without considering ALL 5 breakpoints.
5. NEVER add placeholder TODO comments — implement fully or ask.
6. ALWAYS apply Framer Motion entrance animations to every new component.
7. ALWAYS check classey-ui skill for exact glassmorphism values before styling.
8. ALWAYS check classey-database skill before referencing any Appwrite collection
   or field name.
9. ALWAYS check classey-features skill before implementing any feature logic.
10. ALWAYS check classey-screens skill before building any page or modal.

---

## 🛠️ Complete Tech Stack

### Frontend
| Technology        | Version  | Purpose                              |
|-------------------|----------|--------------------------------------|
| Next.js           | 15.x     | React framework, App Router          |
| React             | 19.x     | UI library                           |
| TypeScript        | 5.x      | Type safety — NO `any` ever          |
| Tailwind CSS      | 4.x      | Utility-first styling                |
| shadcn/ui         | Latest   | Base accessible components (always customized) |
| Framer Motion     | 11.x     | ALL animations and transitions       |
| FullCalendar      | 6.x      | Weekly calendar, 24h timeline        |
| Recharts          | 2.x      | Charts — always themed to app colors |
| Zustand           | 5.x      | Global client state                  |
| TanStack Query    | 5.x      | Server state, caching, Appwrite sync |
| React Hook Form   | 7.x      | All forms                            |
| Zod               | 3.x      | All schema validation                |
| Sonner            | Latest   | iOS-style toast notifications        |
| Vaul              | Latest   | Bottom sheets and drawers            |
| CMDK              | Latest   | Global search command palette        |
| date-fns          | Latest   | All date manipulation                |

### Backend (Appwrite Cloud)
| Service              | Purpose                                      |
|----------------------|----------------------------------------------|
| Appwrite Database    | 23 collections (see classey-database skill)  |
| Appwrite Storage     | Files: PDF, TXT, PPT, XLS, PY, C/C++, images|
| Appwrite Functions   | Auto-absent logic, scheduled reminders       |
| Appwrite Realtime    | Live UI updates                              |
| Appwrite Messaging   | Web Push notifications                       |

### AI / LLM
| Provider        | Role      | Limit              |
|-----------------|-----------|--------------------|
| Groq            | Primary   | Try first always   |
| Google AI Studio| Fallback  | Only if Groq fails |
| Vercel AI SDK   | Interface | Unified wrapper    |

**AI Rules:**
- 50 total requests per day across both providers combined
- Groq is always tried first
- Switch to Google AI on ANY Groq error (rate limit, timeout, API error)
- Daily counter resets at midnight IST
- Display usage: "AI: X/50 requests used today"
- Save only last 10–20 messages in ai_conversations collection
- Auto-clear messages older than the 20-message window

### Notifications
| Channel      | Implementation              | Default state          |
|--------------|-----------------------------|------------------------|
| Telegram Bot | Next.js API route           | ON for exams/assignments/deadlines/tasks |
| Web Push     | Appwrite Messaging          | OFF by default         |

**Notification defaults:**
- Exams: Telegram ON, Push OFF
- Assignments: Telegram ON, Push OFF
- Deadlines: Telegram ON, Push OFF
- Tasks: Telegram ON, Push OFF
- Classes: Telegram OFF (per-subject toggle), Push OFF

---

## 🔐 Access Control

**Method:** Single password via environment variable
**Flow:**
1. User visits app for first time
2. Full-screen animated password modal appears (themed, beautiful — NOT a plain input)
3. User enters `APP_PASSWORD` value
4. Correct → store auth token in httpOnly cookie (30-day expiry)
5. Wrong → shake animation + "Incorrect password" error message
6. Subsequent visits → cookie check → skip modal → go straight to dashboard
7. No multi-user, no OAuth, no JWT complexity — just one env var password

---

## 🎨 UI/UX System — STRICT RULES

### Theme
- **Default:** Dark mode
- **Available:** Light mode (toggle in settings)
- **Accent colors:** Each semester has its own hex color that affects the ENTIRE
  page via CSS variables — buttons, borders, progress rings, chart colors, etc.
- **Font:** Nunito (default), Poppins, Quicksand — all rounded and friendly
- **Never use sharp/corporate-looking fonts**

### Glassmorphism (Exact Values — DO NOT DEVIATE)
```css
/* Standard card */
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.10);
border-radius: 16px;

/* Elevated card (modals, dropdowns) */
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 20px;
```

### Glowing Border (Cards — Exact Values)
```css
/* Use on Semester and Subject cards */
box-shadow:
  0 0 0 1px rgba(var(--accent-rgb), 0.3),
  0 0 20px rgba(var(--accent-rgb), 0.15),
  0 0 40px rgba(var(--accent-rgb), 0.05);
```

### Animation Durations (ALWAYS USE THESE)
| Type                  | Duration | Easing            |
|-----------------------|----------|-------------------|
| Micro (hover, toggle) | 150ms    | ease-out          |
| Standard (modal open) | 250ms    | spring            |
| Page transition       | 300ms    | easeInOut         |
| Background animation  | varies   | linear (looped)   |
| Card entrance         | 400ms    | spring(stiffness 300, damping 30) |
| Stagger delay         | 50ms     | per item          |

### Responsive Breakpoints (ALL components must work at ALL sizes)
| Name    | Width  | Behavior                                    |
|---------|--------|---------------------------------------------|
| Mobile  | 375px  | Single column, bottom nav, full-width modals|
| Mobile+ | 430px  | iPhone Pro Max, same as mobile              |
| Tablet  | 768px  | 2-column layouts, side nav starts appearing |
| Tablet+ | 1024px | Full sidebar, multi-column cards            |
| Desktop | 1280px | Full layout, 1/3 sidebar + 2/3 main        |
| Wide    | 1440px | Max-width containers, no stretch            |
| Ultra   | 1920px | Same as 1440 with more whitespace           |

### Backgrounds (User-selectable in Settings)
| ID             | Description                  | Default |
|----------------|------------------------------|---------|
| spooky-smoke   | Animated smoke effect        | ✅ YES  |
| dotted         | Subtle dot pattern           |         |
| boxes          | Animated grid boxes          |         |
| dot-pattern    | Static dot grid              |         |
| noise-grid     | Noisy grid texture           |         |

### Navigation
- **Desktop:** Minimal dock — icons + text labels
- **Mobile:** Minimal dock — icons only, fixed to bottom
- **Back button:** On ALL inner pages
- **Floating AI bubble:** Bottom-right corner, always visible

### Card Interactions
| Platform | Short action       | Long action                     |
|----------|--------------------|---------------------------------|
| Mobile   | Short tap → navigate | Long press (500ms) → expand/context menu |
| Desktop  | Single click → navigate | Right-click → context menu, hover icon → expand |

### Modals
- Center popup on desktop
- Full-screen or bottom sheet on mobile
- MUST match app theme (dark/light + accent colors)
- Always scrollable if content overflows
- Proper touch targets (min 44×44px)
- Escape key closes
- Click outside closes
- Entrance: scale(0.95) + opacity(0) → scale(1) + opacity(1), 250ms spring

### Toast Notifications (Sonner)
- iOS-style slide-in from bottom-right (desktop) or bottom-center (mobile)
- ALWAYS include Undo button for destructive actions (5-second window)
- Format: "Action completed. [Undo]"

### Charts (Recharts)
- ALWAYS use semester accent color as primary chart color
- ALWAYS match dark/light theme background
- Circular progress rings for attendance stats
- Line charts for CGPA trends and exam trends
- Bar charts for subject comparisons

### Loading States
- Spinner/loading icon — never blank white flash
- Skeleton loaders for cards during data fetch

### Empty States
- Illustration + helpful text + action button
- Used as onboarding guide (no wizard)

---

## 📁 Project Structure

```
classey/
├── .github/
│   ├── copilot-instructions.md     ← this file
│   ├── prompts/                    ← reusable prompt templates
│   └── skills/                    ← auto-loading agent skills
│       ├── classey-ui/
│       ├── classey-database/
│       ├── classey-features/
│       ├── classey-screens/
│       ├── premium-frontend-ui/
│       └── se-ux-ui-designer/
├── src/
│   ├── app/                       ← Next.js App Router
│   │   ├── (auth)/               ← password gate layout
│   │   ├── (dashboard)/          ← main app layout
│   │   │   ├── page.tsx          ← home/dashboard
│   │   │   ├── semester/[id]/    ← semester detail
│   │   │   ├── analytics/        ← CGPA, weekly summary
│   │   │   ├── tasks/            ← all tasks view
│   │   │   ├── calendar/         ← full calendar view
│   │   │   ├── tools/            ← bunk planner, grade calc
│   │   │   ├── settings/         ← all settings
│   │   │   └── files/            ← file browser
│   │   └── api/
│   │       ├── telegram/         ← Telegram bot webhook
│   │       └── ai/               ← AI chat endpoint
│   ├── components/
│   │   ├── ui/                   ← shadcn base components (always customized)
│   │   ├── layout/               ← dock, back button, AI bubble
│   │   ├── cards/                ← all card components
│   │   ├── modals/               ← all 16 modals
│   │   ├── calendar/             ← FullCalendar wrappers
│   │   ├── charts/               ← Recharts wrappers
│   │   ├── backgrounds/          ← all 5 background animations
│   │   └── forms/                ← reusable form components
│   ├── lib/
│   │   ├── appwrite.ts           ← Appwrite client config
│   │   ├── ai.ts                 ← Groq + Google AI with fallback
│   │   ├── telegram.ts           ← Telegram bot client
│   │   └── utils.ts              ← cn() and other utilities
│   ├── hooks/
│   │   ├── use-semesters.ts      ← TanStack Query hooks
│   │   ├── use-subjects.ts
│   │   ├── use-attendance.ts
│   │   └── ...                   ← one file per collection
│   ├── stores/
│   │   ├── theme-store.ts        ← dark/light + accent color
│   │   ├── settings-store.ts     ← all user preferences
│   │   └── ui-store.ts           ← modal open/close states
│   ├── types/
│   │   ├── database.ts           ← all 23 collection interfaces
│   │   └── index.ts              ← shared TypeScript types
│   └── utils/
│       ├── attendance.ts         ← bunk planner, % calculations
│       ├── grades.ts             ← CGPA, grade point calculations
│       ├── dates.ts              ← IST timezone, date formatting
│       └── slots.ts              ← slot system logic
├── public/
├── .env.local                    ← real secrets (gitignored)
├── .env.example                  ← committed template
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🗄️ Database — 23 Appwrite Collections (Summary)

See `classey-database` skill for complete field definitions.

| # | Collection         | Purpose                                          |
|---|--------------------|--------------------------------------------------|
| 1 | settings           | All user preferences (theme, notifications, etc) |
| 2 | grade_scales       | Letter grade → point mappings (A=10, B=9...)     |
| 3 | slots              | College timetable slot system (15 + Lab + Extra) |
| 4 | semesters          | Semester info, goals, results                    |
| 5 | subjects           | Courses/classes with slot assignments            |
| 6 | class_schedules    | Weekly recurring class patterns                  |
| 7 | class_occurrences  | Individual class sessions + attendance           |
| 8 | exams              | Tests, quizzes, assignments with marks           |
| 9 | tasks              | To-dos with optional deadlines                   |
| 10| events             | Personal calendar events                         |
| 11| holidays           | Days that cancel all classes automatically       |
| 12| resource_links     | YouTube, Notion, Drive links per subject         |
| 13| files              | File metadata linked to lectures/exams/tasks     |
| 14| notifications_log  | Track sent notifications (avoid duplicates)      |
| 15| audit_log          | Full change history                              |
| 16| tags               | Universal tagging system                         |
| 17| tagged_items       | Tag assignments to any entity                    |
| 18| study_sessions     | Pomodoro (future feature, schema ready)          |
| 19| goals              | Flexible goal tracking                           |
| 20| notes              | Quick class notes                                |
| 21| backups            | Export tracking                                  |
| 22| widgets_config     | Widget layout/settings                           |
| 23| ai_conversations   | Last 10–20 AI chat messages (auto-pruned)        |

---

## 📱 All 17 Screens

See `classey-screens` skill for complete wireframes and component lists.

| # | Screen                  | URL                                        |
|---|-------------------------|--------------------------------------------|
| 1 | Home / Dashboard        | /                                          |
| 2 | Semester Detail         | /semester/[id]                             |
| 3 | Subject Detail          | /semester/[id]/subject/[id]                |
| 4 | Subject Attendance      | /semester/[id]/subject/[id]/attendance     |
| 5 | Full Calendar           | /calendar                                  |
| 6 | All Tasks               | /tasks                                     |
| 7 | Files Browser           | /files                                     |
| 8 | CGPA Tracker            | /analytics/cgpa                            |
| 9 | Bunk / Attendance Calc  | /tools/attendance-calculator               |
| 10| Weekly Summary          | /analytics/weekly-summary                  |
| 11| All Tasks View          | /tasks                                     |
| 12| Grade Calculator        | Modal (accessible anywhere)                |
| 13| Timetable Export        | Modal from semester/subject page           |
| 14| Grade Calculator        | /tools/grade-calculator (also modal)       |
| 15| Timetable Export        | Modal                                      |
| 16| Exam Detail             | /semester/[id]/subject/[id]/exam/[id]      |
| 17| Semester Analytics      | /semester/[id]/analytics                   |
| 18| Settings                | /settings                                  |

---

## ⚙️ Settings Page — Everything Is Configurable

Nothing is hardcoded. ALL of these are stored in the `settings` collection:
- Theme mode (dark/light)
- Background style (5 options)
- Font family
- Accent color default
- Timezone (default: Asia/Kolkata)
- First day of week (default: Monday)
- Time format (default: 24h)
- Date format
- SPI/CGPA scale (default: 10)
- Auto-absent hours (default: 48h after class)
- Default attendance requirement (default: 75%)
- Telegram bot chat ID + all notification toggles
- Push notification toggles
- Pre-class reminder minutes (default: 15)
- Week start day
- AI daily limit display

---

## 🎓 Slot System (College Timetable)

Classey uses a real college slot system with 15 regular slots, 4 lab slots, and
Wednesday extra slots. Each slot has sub-slots (e.g. Slot 1 → 1A Monday, 1B Tuesday,
1C Thursday). See `classey-features` skill for complete slot definitions and logic.

**Slot types:** regular | lab | extra
**When creating subjects:** User picks full slot, individual sub-slots, or manual time
**Lab slots:** 3-hour continuous blocks (L1–L4)
**Wednesday extras:** X1, X2, X3, Lx, XC, XD

---

## 🤖 AI Feature Rules

- Floating chat bubble (bottom-right), always visible
- Natural language creation: "Add exam next Tuesday at 2pm for DSA" → creates exam
- Study recommendations based on attendance + upcoming exams
- Goal progress tracking ("Am I on track for 8.5 SPI?")
- Conflict detection (exam + deadline same day)
- Smart deadline warnings (3 deadlines in 48 hours)
- Exam score predictor (marks needed for target grade)
- Display AI request counter prominently: "AI: X/50 today"
- Cache similar queries for 24 hours to save API calls
- NEVER call AI API without checking daily limit first
- Groq model: Use latest available fast model
- Google fallback model: gemini-flash or equivalent free tier

---

## 📋 Feature Implementation Rules

See `classey-features` skill for complete feature logic. Key rules:

**Attendance Auto-Suggest:**
- Shows on home page 30 min AFTER class ends (not during)
- Stacks if multiple classes ended without marking
- Shows quick Present / Absent / Cancelled buttons
- Dismissed after marking or after 2 hours

**Auto-Absent:**
- Triggered by Appwrite Function
- Runs 48 hours (configurable) after class was scheduled
- Only applies if attendance not already marked
- Creates class_occurrence with attendance = "absent"

**Undo System:**
- Every destructive action shows toast with [Undo] button
- 5-second window
- Supported actions: delete, mark absent, complete task, cancel class

**Global Search (Cmd+K / Ctrl+K):**
- Searches: subjects, files, exams, tasks, notes, resource links
- Fuzzy search
- Keyboard shortcut works everywhere
- Built with CMDK

**Free Time Finder:**
- Button on home page
- Finds gaps > 1h 15min in TODAY's schedule
- Shows: "You're free 3:00 PM – 5:00 PM today"

---

## 🔧 Coding Standards — ALWAYS FOLLOW

### TypeScript
- NO `any` type — ever
- ALL functions have explicit return types
- ALL props have explicit interfaces (named `ComponentNameProps`)
- Use Zod schemas for ALL external data validation
- Shared types go in `src/types/database.ts` and `src/types/index.ts`

### File Naming
- Pages: `page.tsx` (Next.js convention)
- Components: `PascalCase.tsx` (e.g. `SemesterCard.tsx`)
- Hooks: `use-kebab-case.ts` (e.g. `use-semesters.ts`)
- Utilities: `kebab-case.ts`
- Stores: `kebab-case-store.ts`

### Exports
- Named exports ONLY — no default exports (except Next.js pages)
- Every component file exports its Props interface too

### Imports
- Use `@/` path alias for all internal imports
- Group: React → Next.js → Third-party → Internal
- No barrel files (index.ts re-exports) — import directly

### Data Fetching
- TanStack Query for ALL Appwrite data — never raw fetch in components
- One hook file per Appwrite collection
- Query keys: `['collection-name', id?, filters?]`
- Optimistic updates for: attendance marking, task completion, deletions

### State Management
- Zustand for: theme, settings, modal open/close states, current semester
- TanStack Query for: all server/Appwrite data
- useState for: local UI state only (form steps, accordion open, etc.)
- Never store server data in Zustand

### Error Handling
- ALL async functions wrapped in try/catch
- Typed errors — never `catch (e: any)`
- Show Sonner toast on error with user-friendly message
- Log full error to console for debugging
- Never let errors silently fail

### Function Length
- Max 40 lines per function — extract if longer
- Single responsibility — one function does one thing

### Comments
- JSDoc for all exported functions and components
- Inline comments for complex logic (slot calculations, CGPA math)
- No `// TODO` — either implement or create a GitHub issue

---

## 🌍 Timezone & Date Rules

- ALL dates stored in UTC in Appwrite
- ALL dates displayed in user's timezone (default: Asia/Kolkata / IST)
- Time format: 24h default, configurable
- Date format: DD/MM/YYYY default, configurable
- Week starts Monday (configurable in settings)
- Use `date-fns` and `date-fns-tz` for ALL date operations
- NEVER use `new Date()` directly for display — always format with date-fns

---

## 🚀 Environment Variables

All env vars are prefixed properly:
- `NEXT_PUBLIC_*` — safe to expose to browser
- No prefix — server-only (API routes, Server Components)

Key vars (see .env.example for full list):
- `APP_PASSWORD` — the single access password
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` — server-only
- `GROQ_API_KEY` — server-only
- `GOOGLE_AI_API_KEY` — server-only
- `TELEGRAM_BOT_TOKEN` — server-only
- `AUTH_COOKIE_SECRET` — for signing the auth cookie

---

## 📊 Current Implementation Phase

**Phase 1 — Foundation (CURRENT)**
- [ ] Project setup, env config, Appwrite init
- [ ] Password gate + auth cookie system
- [ ] Theme system (dark/light + CSS variable accent color)
- [ ] Background animations (all 5)
- [ ] Settings page + settings collection
- [ ] Global layout (dock navigation, AI bubble placeholder)

See `COPILOT_CONTEXT.md` for detailed daily progress tracking.

---

## 🏗️ Implementation Phase Roadmap

| Phase | Focus                                               |
|-------|-----------------------------------------------------|
| 1     | Foundation: setup, auth, theme, backgrounds, settings|
| 2     | Semester + Subject CRUD (core data layer)           |
| 3     | Slot system + Class schedules                       |
| 4     | Dashboard + Weekly Calendar (FullCalendar)          |
| 5     | Attendance marking + Auto-absent Appwrite Function  |
| 6     | Exams + Tasks + Personal Events                     |
| 7     | Analytics: CGPA tracker, Bunk planner, Grade calc   |
| 8     | Files, Resource links, Notes                        |
| 9     | AI chat (Groq + Google fallback)                    |
| 10    | Notifications (Telegram Bot + Web Push)             |
| 11    | Export, Global Search, Undo system, Polish          |
| 12    | Edge cases, performance, final responsive QA        |