---
name: classey-screens
description: >
  Classey screens and pages skill. Load this skill when building ANY page,
  screen, route, layout, or navigation element in Classey. Contains exact
  URLs, component lists, layout descriptions, wireframe behavior, and
  page-specific rules for all 17 screens. Triggers: 'page', 'screen',
  'route', 'layout', 'navigate', 'dashboard', 'home', 'semester', 'subject',
  'attendance', 'calendar', 'tasks', 'files', 'analytics', 'CGPA', 'bunk',
  'calculator', 'weekly summary', 'insights', 'exam detail', 'settings',
  'timetable', 'grade calculator', 'export', 'build page', 'create page',
  'scaffold', 'new screen', 'new route'.
---

# Classey — All 17 Screens

ALWAYS reference this skill before building any page or route.
Contains exact layout, components used, and behavior for every screen.

---

## Global Layout Rules (Apply to ALL screens)

```
Fixed elements always present:
  1. Background animation (user-selected, fixed, -z-10)
  2. Navigation Dock (fixed, bottom on mobile / left on desktop)
  3. Floating AI Chat Bubble (fixed, bottom-right, z-50)
  4. Sonner Toaster (fixed, bottom-right)
  5. Global Search (CMDK, triggered by Cmd+K / Ctrl+K, z-60)

Page content:
  - Wrapped in motion.main for page transition animation
  - Padded to avoid dock overlap (pb-24 on mobile, pl-20 on desktop)
  - Max-width: none (full width) — containers handle internal max-width
  - Background: transparent (shows through to animated background)

Back button:
  - Present on ALL inner pages (not home, not top-level nav pages)
  - Top-left, fixed position within page header
  - Uses router.back() — preserves navigation history
```

---

## SCREEN 1: Home / Dashboard

```
URL: /
File: src/app/(dashboard)/page.tsx
Title: "Good morning, Melvin" (time-based greeting)
```

### Layout (Desktop 1280px+)
```
Left: Fixed dock (icons + text labels)
Right: Main content area

Main content split:
  LEFT 1/3 (sidebar, independent scroll):
    - Greeting header + current date (IST)
    - Attendance Auto-suggest cards (stacked, if any)
    - Smart deadline warning banner (if 3+ deadlines in 48h)
    - Free Time Finder button
    - Today's classes list
    - Quick stats (attendance %, tasks due, next exam)

  RIGHT 2/3 (main, independent scroll):
    - FullCalendar week view (current semester only)
    - Upcoming exams (next 3, with countdown)
    - Pending tasks (next 5, with priority)
```

### Layout (Mobile under 768px)
```
Single column, scrollable top to bottom:
  1. Greeting header + date
  2. Attendance Auto-suggest cards (if any)
  3. Smart deadline warning banner (if applicable)
  4. Quick stats row (3 stat cards, horizontal scroll)
  5. Today's classes (horizontal scroll cards)
  6. Week calendar (compact, 3-day or day view)
  7. Upcoming exams (next 3)
  8. Pending tasks (next 5)
  Fixed bottom: dock
```

### Components Used
```
- GreetingHeader
- AttendanceAutoSuggestCard (stacked, dismissible)
- SmartDeadlineWarningBanner
- FreeTimeFinderButton
- TodayClassesList
- QuickStatsRow (3 cards: attendance %, tasks due, exam countdown)
- WeekCalendarView (FullCalendar, current semester only)
- UpcomingExamsList (3 items max)
- PendingTasksList (5 items max)
- FloatingAIBubble (global, always visible)
```

### Page Rules
```
- Always opens here (no position restore)
- Accent color = ongoing semester color
- If no ongoing semester = settings.accent_color_default
- Calendar: ONLY shows current active semester events
- Quick attendance: only for classes that have occurred OR are occurring now
- Auto-suggest: refresh when tab regains focus
```

---

## SCREEN 2: Semester Detail

```
URL: /semester/[id]
File: src/app/(dashboard)/semester/[id]/page.tsx
Back button: Yes -> /
Accent: THIS semester's color (overrides ongoing semester color)
```

### Layout
```
HEADER:
  - Semester name (large) + start-end date range
  - Status badge: ongoing / upcoming / completed
  - SPI value (if completed)
  - [Edit] button top-right
  - Accent color = this semester's color

TABS (sticky below header):
  [Overview] [Subjects] [Calendar] [Exams]

Tab: OVERVIEW
  - Goal tracking card (target SPI vs current projection + progress bar)
  - Overall attendance ring (circular, large)
  - Subject cards grid (2-col desktop, 1-col mobile)
  - Exam timeline (horizontal scroll: upcoming + recent)
  - Action buttons: [+ New Subject] [+ New Exam] [Export Timetable]
    [View Analytics]

Tab: SUBJECTS
  - Full subject card grid
  - [+ Add Subject] prominent button
  - Each card: name, short_name, attendance ring, credits, type badge
  - Empty state: "No subjects yet. Add your first subject."

Tab: CALENDAR
  - FullCalendar week view (this semester only)
  - Shows: classes, exams, events, task deadlines
  - Color-coded by subject

Tab: EXAMS
  - Exam list sorted by date
  - Filter: [Upcoming] [Completed] [All]
  - Each item: name, subject tag, date, marks (if done), type badge
  - [+ Add Exam] button
```

---

## SCREEN 3: Subject Detail

```
URL: /semester/[id]/subject/[id]
File: src/app/(dashboard)/semester/[id]/subject/[id]/page.tsx
Back button: Yes -> /semester/[id]
```

### Layout
```
HEADER:
  - Subject name (large) + short_name chip + course code
  - Type badge (Theory / Lab / Practical / Project)
  - Teacher info (if set, shown as small text)
  - [Edit] [Delete] actions

STATS ROW (horizontal scroll on mobile):
  - Large attendance ring (% + attended/total)
  - Current grade chip
  - Credits badge
  - Next class info

TABS:
  [Overview] [Attendance] [Exams] [Files & Links] [Notes]

Tab: OVERVIEW
  - Bunk planner summary: "You can bunk X more classes"
  - Slot info card: which slots/sub-slots assigned
  - Upcoming classes this week (next 3)
  - Recent exam scores (last 3)
  - Actions: [Add Extra Class] [Mark Holiday] [Grade Calculator]
    [Full Bunk Planner]

Tab: ATTENDANCE
  - Quick mark for today's class (if applicable, 30min window)
  - Attendance history list (most recent first)
  - Filter: [All] [Present] [Absent] [Cancelled]
  - Each row: date, day, time, status badge, note, edit button
  - [View Full History] link -> /semester/[id]/subject/[id]/attendance

Tab: EXAMS
  - Exam cards with marks, weightage, type, date
  - Grade projection card (current % + what grade on track for)
  - [+ Add Exam] button

Tab: FILES & LINKS
  - Resource links section (grid of link cards with icons)
  - Files section (uploaded files list)
  - Past papers section (is_past_paper = true, separate)
  - [+ Add Link] [+ Upload File] buttons

Tab: NOTES
  - Notes list (pinned first, then by date)
  - Click to edit inline
  - [+ Add Note] button
```

---

## SCREEN 4: Subject Attendance History

```
URL: /semester/[id]/subject/[id]/attendance
File: src/app/(dashboard)/semester/[id]/subject/[id]/attendance/page.tsx
Back button: Yes -> subject page
```

### Layout
```
HEADER:
  - "[Subject name] Attendance"
  - Summary stat: "X / Y classes (Z%)"
  - Requirement badge

FILTER BAR:
  Status: [All] [Present] [Absent] [Cancelled] [Unmarked]
  Period: [This Month] [Last Month] [All Time]

LIST:
  Each row:
    - Date (formatted: "Mon, Apr 6")
    - Time range ("09:00 - 10:30")
    - Status badge (color-coded)
    - Note chip (if note exists)
    - [Edit] button

  Edit mode (inline per row):
    - Status selector: Present / Absent / Cancelled
    - Note text field
    - [Save] [Cancel]
    - Saves to class_occurrence + logs to audit_log

STICKY FOOTER:
  Present: X | Absent: Y | Cancelled: Z | Unmarked: W
  Current: ZZ.Z%
```

---

## SCREEN 5: Full Calendar

```
URL: /calendar
File: src/app/(dashboard)/calendar/page.tsx
Back button: No (top-level nav item)
```

### Layout
```
HEADER:
  - "Calendar" + current period label
  - View: [Day] [Week] [Month] toggles
  - Nav: [<- Prev] [Today] [Next ->]
  - Filters: [Classes] [Exams] [Tasks] [Events] checkboxes
  - Semester filter dropdown

MAIN (full remaining height):
  FullCalendar component:
    - Week view: 24h timeline, current time white line indicator
    - Events sized by duration
    - Overlapping events: side-by-side
    - Event text: truncated + tooltip on hover/tap
    - Click empty slot -> quick create popover (choose type)
    - Click event -> detail popover ([Edit] [Delete] [Mark Attendance])

Event colors:
  - Classes: subject color
  - Exams: red-orange tint
  - Tasks with deadline: amber tint
  - Personal events: user color or accent
  - Holidays: muted overlay across full day
```

---

## SCREEN 6: All Tasks

```
URL: /tasks
File: src/app/(dashboard)/tasks/page.tsx
Back button: No (top-level nav)
```

### Layout
```
HEADER:
  - "Tasks"
  - [+ New Task] button (top-right)

FILTER BAR:
  - Status: [All] [Pending] [Completed] [Overdue]
  - Subject: [All Subjects dropdown]
  - Priority: [All] [High] [Medium] [Low]
  - Sort: [Deadline] [Priority] [Created]

TASK LIST:
  Grouped sections (optional, can toggle):
    Today | Tomorrow | This Week | Later | No Deadline | Completed

  Each task card:
    Desktop: [checkbox] title | subject tag | deadline | priority badge | [...menu]
    Mobile: same layout, swipe right = complete (green reveal)

  Completion:
    - Checkbox or swipe triggers complete
    - Strikethrough animation
    - 5-second fade-out (with Undo toast)
    - Completed section collapsed by default

EMPTY STATES:
  No pending tasks: "All clear! No pending tasks."
  Active filter + no results: "No tasks match this filter."
  Both with appropriate illustration
```

---

## SCREEN 7: Files Browser

```
URL: /files
File: src/app/(dashboard)/files/page.tsx
Back button: No (top-level nav)
```

### Layout
```
HEADER:
  - "Files"
  - Search input (filter by filename, real-time)
  - [+ Upload] button
  - View toggle: [Grid] [List]

FILTER BAR:
  - Subject: dropdown
  - Type: [All] [PDF] [Images] [Code] [Docs] [Spreadsheets]
  - Context: [All] [Exam Files] [Task Files] [Class Notes] [Past Papers]

GRID VIEW (default):
  File cards (3-col desktop, 2-col tablet, 1-col mobile):
    - File type icon (large, color-coded)
    - Filename (truncated)
    - Subject tag
    - File size + upload date
    - Hover actions: [Download] [Link] [Delete]

LIST VIEW:
  Table: Icon | Filename | Subject | Context | Size | Date | Actions

UPLOAD:
  - Drag-and-drop zone (visible when dragging over page)
  - File picker fallback
  - Progress bar during upload
  - Context selector after upload (link to subject/exam/task)

PREVIEW:
  - Images: lightbox overlay
  - PDF: open getFileDownload URL in new tab
  - Code/other: download directly
```

---

## SCREEN 8: CGPA Tracker

```
URL: /analytics/cgpa
File: src/app/(dashboard)/analytics/cgpa/page.tsx
Back button: No (top-level analytics section)
```

### Layout
```
HEADER:
  - "CGPA Tracker"
  - Current CGPA: huge animated number (count-up animation on load)
  - "/ 10" (or settings.spi_scale)

SECTION 1: CGPA TREND CHART
  - Recharts LineChart
  - X-axis: semester names
  - Y-axis: 0 to spi_scale
  - Line 1: SPI per semester (accent color)
  - Line 2: Running CGPA (white/muted)
  - If ongoing semester: dotted projected line

SECTION 2: SEMESTER BREAKDOWN
  List/table:
    Semester name | SPI | Credits | Status
    Completed: SPI value + check mark
    Ongoing: "--" for SPI
    Quick-input: SPI with lightning bolt badge
  Click row -> navigate to that semester

SECTION 3: WHAT-IF CALCULATOR
  Two inputs (both live-calculate):
    "If I score [ SPI input ] this semester"
    -> "Your CGPA will be: X.XX" (updates live)

    "To reach CGPA [ target input ]"
    -> "You need SPI: X.XX this semester"
    -> Color: green if achievable, red if X > spi_scale
```

---

## SCREEN 9: Bunk Planner / Attendance Calculator

```
URL: /tools/attendance-calculator
File: src/app/(dashboard)/tools/attendance-calculator/page.tsx
Back button: Yes
Query params: ?subject=[id] to pre-select a subject
```

### Layout
```
HEADER:
  - "Attendance Calculator"
  - Subject selector: [All Subjects] or specific subject dropdown

"All Subjects" mode:
  Each subject as its own collapsible card showing:
  - Attendance % ring + can-bunk number
  - Expand for full details

Single subject mode (detailed):

  CARD 1: CURRENT STATUS
    - "Attended: 15 / 19 classes"
    - Circular attendance ring (large, color-coded)
    - "Required: 75%" + status badge

  CARD 2: SURVIVAL CALCULATOR
    - "Attend all X remaining: -> ZZ% [badge]"
    - "Miss all X remaining:   -> ZZ% [badge]"

  CARD 3: BUNK PLANNER
    - Large circular badge with number: "2" (can bunk)
    - "...and still maintain 75%"
    - Warning if 0: "No bunk margin!"
    - Warning if <= 2: "Low margin, be careful."

  CARD 4: CUSTOM SCENARIO
    - Stepper/slider: "I will attend [X] of remaining [Y] classes"
    - Live result: "Result: ZZ.Z% -- Safe / At Risk / Danger"
    - Framer Motion: animate the percentage number on change
```

---

## SCREEN 10: Weekly Summary

```
URL: /analytics/weekly-summary
File: src/app/(dashboard)/analytics/weekly-summary/page.tsx
Back button: Yes
```

### Layout
```
HEADER:
  - "Weekly Summary"
  - Period: "Week of Mar 31 - Apr 6, 2026"
  - Nav: [<- Previous Week] [Next Week ->] (future weeks disabled)

SECTION: ATTENDANCE
  - Classes scheduled / attended / missed / cancelled
  - Trend vs last week: "Up 5% from last week" with colored arrow

SECTION: TASKS
  - Completed / Pending / Overdue counts
  - Overdue tasks: listed by name with red urgent styling

SECTION: EXAMS
  - Completed this week: name + score
  - Upcoming this week: name + date

SECTION: AI INSIGHTS (on-demand)
  - [Generate AI Summary] button (1 AI request, cached 24h per week)
  - Shows 2-3 sentence AI summary
  - Specific actionable advice

FOOTER:
  [View Last Week]  [View All Weeks]
```

---

## SCREEN 11: Exam Detail

```
URL: /semester/[id]/subject/[id]/exam/[id]
File: src/app/(dashboard)/semester/[id]/subject/[id]/exam/[id]/page.tsx
Back button: Yes -> subject page
```

### Layout
```
HEADER:
  - Exam name + subject name
  - Type badge + status (upcoming/completed/missed)
  - [Edit] [Delete] top-right

If COMPLETED:
  SCORE SECTION:
    - Large circle: "45 / 60" + "75%"
    - Weightage: "30% of final grade"
    - Contribution: "22.5 / 30 points"
    - Grade badge: "B+"

DETAILS SECTION:
  - Date (formatted long: "March 28, 2026")
  - Time + duration (if set)
  - Location (if set)
  - Syllabus (expandable if long)

RELATED FILES:
  - File chips linked to this exam
  - [+ Add File] button

NOTES SECTION:
  - Personal exam notes (inline editable)
  - Placeholder: "Add notes, mistakes to review, etc."

If UPCOMING (no marks yet):
  - Countdown: "In 3 days, 4 hours" (color-coded)
  - Syllabus prominently displayed
  - No score section
  - [Add Marks] button (after exam date passes)
```

---

## SCREEN 12: Semester Analytics

```
URL: /semester/[id]/analytics
File: src/app/(dashboard)/semester/[id]/analytics/page.tsx
Back button: Yes -> /semester/[id]
```

### Layout
```
HEADER: "[Semester] Insights"

ATTENDANCE OVERVIEW:
  - Bar chart: all subjects attendance %
  - Bars: green >= requirement, yellow near, red below
  - Best + worst subject callouts

EXAM PERFORMANCE:
  - Multi-line chart: one line per subject, exam scores over time
  - Best + worst subject callouts
  - Overall average

PATTERNS (computed, no AI):
  - Most missed day of week
  - Task completion rate
  - Attendance-grade correlation note

AI RECOMMENDATIONS (on demand):
  - [Generate Recommendations] button (1 AI request, cached 24h)
  - 3-5 bullet recommendations

GOAL PROGRESS (if target_spi set):
  - Progress bar: current projected SPI vs target
  - "On track" or "Needs attention" label
```

---

## SCREEN 13: Grade Calculator

```
URL: /tools/grade-calculator
File: src/app/(dashboard)/tools/grade-calculator/page.tsx
Also: src/components/modals/GradeCalculatorModal.tsx
Back button: Yes (page), X button (modal)
```

### Layout
```
HEADER: "Grade Calculator"
Subject selector dropdown

CURRENT MARKS:
  List of completed exams:
  "Quiz 1:   18/20  (10% weight) -> 9/10 points"
  "Midterm:  45/60  (30% weight) -> 22.5/30 points"
  Subtotal: "Earned: 39.5 / 50 points (79%)"

REMAINING EXAMS:
  "Final Exam: [  ] / 100  (50% weight)"
  User can type in marks to see projection

WHAT DO I NEED:
  For each grade in scale (A, A-, B+, B...):
  "To get A  (90%): Need 81/100 -> Achievable"
  "To get B+ (80%): Need 61/100 -> Easy"
  "To get A+ (95%): Need 101/100 -> Impossible"
  Color: green = easy, yellow = hard, red = impossible
  Live recalculation as user types in remaining marks
```

---

## SCREEN 14: Timetable Export Modal

```
Trigger: Button on /semester/[id]
File: src/components/modals/TimetableExportModal.tsx
Desktop: centered modal | Mobile: bottom sheet (Vaul)
```

### Layout
```
Title: "Export Timetable"

Period selector: [This Week] [Full Semester] [Custom Range]

PREVIEW:
  Mini timetable grid (rendered in modal)
  Columns: Mon Tue Wed Thu Fri [Sat if applicable]
  Rows: time slots
  Cells: subject short_name + room

OPTIONS:
  Format: [PNG] [JPG] [PDF] radio
  Include: checkbox Room numbers, checkbox Teacher names
  Style: [Dark] [Light] [Accent Color] radio

ACTIONS:
  [Cancel]  [Download]  [Share] (Web Share API on mobile)

Implementation:
  html2canvas for PNG/JPG capture
  jsPDF for PDF generation
  Show loading spinner during generation
```

---

## SCREEN 15: Settings

```
URL: /settings
File: src/app/(dashboard)/settings/page.tsx
Back button: No (top-level nav)
```

### Layout
```
HEADER: "Settings"

Each section is a glassmorphism card, collapsible:

1. APPEARANCE
   Theme toggle (Dark/Light with live preview)
   Background picker (5 options, thumbnail previews, radio)
   Font family dropdown (live preview of font name in chosen font)
   Default accent color (preset swatches + custom hex input)

2. BEHAVIOR
   Timezone: searchable dropdown (all IANA zones)
   Week start: Monday / Sunday radio
   Time format: 24h / 12h radio
   Date format: dropdown

3. ACADEMIC
   SPI/CGPA scale: number input
   Default attendance requirement: number + % suffix
   Auto-absent after: number + "hours" suffix

4. TELEGRAM NOTIFICATIONS
   Master enable toggle
   Setup guide (expandable instructions)
   Chat ID input + [Test Message] button
   Individual toggles: Exams, Assignments, Deadlines, Tasks, Classes
   Pre-class reminder: number + "minutes before class" label

5. WEB PUSH NOTIFICATIONS
   Master enable toggle (triggers browser permission on first enable)
   Individual toggles (same as Telegram)

6. GRADE SCALES
   List of scales (Default + any custom)
   Default scale: expandable grade-points editor (inline)
   [+ Add Custom Scale] button
   Custom scales: editable + deletable

7. SLOT SYSTEM
   List of all slots with sub-slot details
   Pre-seeded: edit allowed, delete not allowed (restore option)
   Custom: full edit + delete
   [+ Add Custom Slot] button

8. DATA & EXPORT
   [Export JSON] button + scope checkboxes
   [Export CSV] button + scope checkboxes
   Backup history table (date, type, size, status, re-download)
   AI usage: "X / 50 requests used today" with reset time

9. ACCOUNT
   Note about password (requires Vercel env var update)
   [Sign Out] button (clears cookie, redirects to /auth)
```

---

## SCREEN 16: Auth / Password Page

```
URL: /auth
File: src/app/(auth)/page.tsx
Layout: Completely isolated (no dock, no nav, no AI bubble)
```

### Layout
```
Full-screen centered, animated background (spooky smoke default):

App logo / wordmark "Classey" with Framer Motion entrance
Tagline: "Your university life, organized."

Glassmorphism card (elevated style):
  - "Welcome back" heading
  - Password input (show/hide toggle)
  - [Unlock ->] button (accent color, full width)

States:
  - Idle: normal input + button
  - Loading: button spinner
  - Wrong password: input shakes (Framer Motion keyframes),
    error text: "Incorrect password" (red, fade in)
  - Correct: success pulse animation -> redirect to /

Auto-redirect:
  - If valid cookie exists on page load -> immediate redirect to /
  - No flash of auth page if already authenticated
```

---

## SCREEN 17: AI Chat Panel

```
Not a route — overlay panel triggered by FloatingAIBubble
File: src/components/layout/AIChatPanel.tsx
Desktop: fixed right panel 380px, slides from right
Mobile: full-screen bottom sheet (Vaul)
```

### Layout
```
HEADER:
  - "Classey AI" + sparkle icon
  - Usage badge: "12 / 50 today"
  - [Clear History] | [Close X]

MESSAGES (scrollable, auto-scrolls to bottom):
  User message: right-aligned, accent color background, rounded
  AI message: left-aligned, glassmorphism card
  Each message: content + time + provider chip (Groq / Google)
  Loading: animated 3-dot typing indicator

QUICK ACTIONS (horizontal scroll, above input):
  [Weekly Summary] [Due today?] [Attendance check]
  [Am I on track?] [Add exam...]
  Each chip: sends preset prompt to AI

INPUT AREA:
  - Text input: "Ask me anything..."
  - [Send] button (disabled if empty or limit hit)
  - Limit reached: grey out + "Daily limit reached. Resets midnight IST."

BEHAVIOR:
  - Load last 10-20 messages from ai_conversations on open
  - Append new messages optimistically
  - Prune oldest when count exceeds 20
  - AI context injected server-side (semester, subjects, exams, tasks)
  - Close: panel slides back, bubble remains visible
```

---

## Route Summary

```
src/app/
  (auth)/
    page.tsx                              -> /auth
  (dashboard)/
    layout.tsx                            -> shared dashboard layout
    page.tsx                              -> /
    calendar/
      page.tsx                            -> /calendar
    tasks/
      page.tsx                            -> /tasks
    files/
      page.tsx                            -> /files
    analytics/
      cgpa/
        page.tsx                          -> /analytics/cgpa
      weekly-summary/
        page.tsx                          -> /analytics/weekly-summary
    tools/
      attendance-calculator/
        page.tsx                          -> /tools/attendance-calculator
      grade-calculator/
        page.tsx                          -> /tools/grade-calculator
    settings/
      page.tsx                            -> /settings
    semester/
      [id]/
        page.tsx                          -> /semester/[id]
        analytics/
          page.tsx                        -> /semester/[id]/analytics
        subject/
          [id]/
            page.tsx                      -> /semester/[id]/subject/[id]
            attendance/
              page.tsx                    -> /semester/[id]/subject/[id]/attendance
            exam/
              [id]/
                page.tsx                  -> /semester/[id]/subject/[id]/exam/[id]
  api/
    auth/
      login/
        route.ts                          -> POST /api/auth/login
      logout/
        route.ts                          -> POST /api/auth/logout
    ai/
      chat/
        route.ts                          -> POST /api/ai/chat
    telegram/
      webhook/
        route.ts                          -> POST /api/telegram/webhook
      test/
        route.ts                          -> POST /api/telegram/test
```

---

## Empty States Reference

```
Home (no active semester):    "No active semester. Let's get started!" + [+ Create Semester]
Semesters (none):             "Add your first semester to begin." + [+ Add Semester]
Subjects (none in semester):  "No subjects yet. Add your first subject." + [+ Add Subject]
Tasks (none):                 "All clear! No pending tasks." + [+ Add Task]
Files (none):                 "No files yet. Attach files to subjects, exams, or tasks." + [+ Upload]
Calendar (nothing in week):   "Nothing scheduled this week." + [+ Add Class]
Attendance (no history):      "No attendance recorded yet."
CGPA (no semesters):          "Add semesters to start tracking CGPA." + [+ Add Semester]
AI Chat (empty):              Quick action chips + "Ask me anything about your academics"
```

---

## Skeleton Loader Reference

```
Every page must show skeleton before data loads.
Match exact shape of actual content.
Style: animate-pulse bg-white/5 rounded-xl

Home:         3 stat card skeletons + calendar placeholder rectangle
Semester:     Header skeleton + 4 subject card skeletons
Subject:      Stats row skeleton + tab content rows
Tasks:        5 task row skeletons
Files:        6 file card skeletons (grid)
CGPA:         Chart placeholder + 4 table row skeletons
Settings:     Section card skeletons (1 per section)
Calendar:     FullCalendar shows built-in loading skeleton
```