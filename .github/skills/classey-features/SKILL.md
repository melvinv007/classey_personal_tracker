---
name: classey-features
description: >
  Classey feature logic and implementation skill. Load this skill when
  implementing ANY feature, calculation, business logic, or behavior in
  Classey. Contains exact formulas, edge cases, rules, and implementation
  details for all 62 features. Triggers: 'attendance', 'bunk', 'planner',
  'calculator', 'CGPA', 'SPI', 'grade', 'marks', 'predict', 'auto-absent',
  'auto suggest', 'undo', 'free time', 'search', 'AI', 'LLM', 'Groq',
  'Google AI', 'telegram', 'notification', 'push', 'reminder', 'slot',
  'schedule', 'calendar', 'export', 'timetable', 'conflict', 'deadline',
  'smart', 'weekly summary', 'insights', 'goal', 'semester', 'subject',
  'holiday', 'extra class', 'cancelled', 'reschedule', 'file', 'link',
  'resource', 'password', 'auth', 'access', 'feature', 'logic', 'formula'.
---

# Classey — All 62 Features with Exact Implementation Logic

ALWAYS reference this skill before implementing any feature. Contains exact
formulas, edge cases, and business rules. Do not improvise logic.

---

## 1. ACCESS CONTROL

### Password Gate
```
Flow:
1. Middleware checks for auth cookie on every request
2. If cookie missing or invalid → redirect to /auth (password page)
3. /auth page: full-screen beautiful animated password modal
4. User enters password → POST /api/auth/login
5. Server compares with process.env.APP_PASSWORD (bcrypt compare)
6. Match → set httpOnly cookie 'classey_auth' (30-day expiry, signed with AUTH_COOKIE_SECRET)
7. No match → return 401 → shake animation on input + "Incorrect password"
8. Cookie present and valid → all routes accessible

Middleware (middleware.ts):
- Runs on all routes except /auth and /api/auth/*
- Verifies cookie signature using AUTH_COOKIE_SECRET
- Invalid cookie → clear cookie + redirect to /auth

Cookie properties:
  httpOnly: true
  secure: true (production only)
  sameSite: 'lax'
  maxAge: 60 * 60 * 24 * 30  (30 days in seconds)
  path: '/'
```

---

## 2. THEME SYSTEM

### Dark/Light Mode
```
- Stored in settings.theme_mode in Appwrite
- Also persisted in localStorage for instant load (no flash)
- Applied via class on <html> element: 'dark' or ''
- ThemeStore (Zustand) is the single source of truth in runtime
- Toggle in settings saves to both localStorage and Appwrite
```

### Semester Accent Color System
```
- Every semester has a hex color (e.g. "#8B5CF6")
- When user navigates to any semester-related page, set accent color
- Active semester's color = page accent color
- Home dashboard = active (ongoing) semester's color
- If no ongoing semester = settings.accent_color_default

Implementation:
1. ThemeStore has setAccentColor(hex: string) action
2. Call setAccentColor when:
   - App loads (use ongoing semester color)
   - User opens a semester page
   - User navigates back to home (reset to ongoing semester)
3. setAccentColor converts hex to RGB and sets --accent CSS variable
4. All themed elements use rgb(var(--accent)) — auto-updates
```

---

## 3. SLOT SYSTEM

### How Slots Work
```
College uses a fixed slot system. Each "slot" (e.g. Slot 1) maps to specific
day+time combinations called sub-slots.

Example: Slot 1
  1A → Monday 08:30-09:25
  1B → Tuesday 09:30-10:25
  1C → Thursday 10:35-11:30

When a subject is assigned "Slot 1":
- It has classes on Monday, Tuesday, AND Thursday at those times
- Auto-creates 3 class_schedule records (one per sub-slot)

User options when creating a subject:
  Option A: "Full slot" → select Slot 1 → creates all 3 sub-slot schedules
  Option B: "Sub-slots" → select specific sub-slots (e.g. only 1A and 1C)
  Option C: "Manual" → enter custom day/time (no slot reference)

Slot picker UI:
  - Dropdown showing slot name + preview of days/times
  - Visual grid showing which days the slot occupies
  - Multi-select for sub-slots in Option B
```

### Auto-generate Class Schedules from Slot
```typescript
// src/utils/slots.ts

function generateSchedulesFromSlot(
  subjectId: string,
  slotId: string,
  selectedSubSlotIds: string[], // empty = all sub-slots
  semesterStartDate: string,
): CreateClassScheduleInput[] {
  const slot = getSlotById(slotId)  // from pre-seeded slots data
  const subSlots = selectedSubSlotIds.length > 0
    ? slot.sub_slots.filter(ss => selectedSubSlotIds.includes(ss.id))
    : slot.sub_slots

  return subSlots.map(subSlot => ({
    subject_id: subjectId,
    slot_id: slotId,
    sub_slot_id: subSlot.id,
    day_of_week: subSlot.day_of_week,
    start_time: subSlot.start_time,
    end_time: subSlot.end_time,
    effective_from: semesterStartDate,
    effective_until: null,
  }))
}
```

---

## 4. ATTENDANCE SYSTEM

### Marking Attendance
```
States: 'present' | 'absent' | 'cancelled' | null (unmarked)

When user marks attendance for a class:
1. Check if class_occurrence exists for (subject_id, date, start_time)
2. If exists → update attendance field
3. If not exists → create new class_occurrence record
4. Record attendance_marked_at = now()
5. Show Sonner toast: "Marked as Present ✓" with [Undo] button (5 sec)

Undo flow:
1. User clicks Undo in toast
2. If occurrence was created → delete it
3. If occurrence existed before → revert attendance to previous value
4. Update UI optimistically via TanStack Query
```

### Attendance Calculation Formula
```typescript
// src/utils/attendance.ts

interface AttendanceStats {
  total_scheduled: number    // all non-cancelled classes
  total_attended: number     // present count
  total_absent: number       // absent count
  total_cancelled: number    // cancelled (not counted)
  percentage: number         // (attended / scheduled) * 100
  required_percent: number   // from subject or settings default
  is_safe: boolean           // percentage >= required_percent
  classes_to_safety: number  // extra classes needed to reach required %
  can_bunk: number           // classes can miss while staying safe
}

function calculateAttendance(
  occurrences: ClassOccurrence[],
  requiredPercent: number
): AttendanceStats {
  const nonCancelled = occurrences.filter(o => o.status !== 'cancelled')
  const attended = occurrences.filter(o => o.attendance === 'present').length
  const total = nonCancelled.length
  const percentage = total > 0 ? (attended / total) * 100 : 0

  return {
    total_scheduled: total,
    total_attended: attended,
    total_absent: occurrences.filter(o => o.attendance === 'absent').length,
    total_cancelled: occurrences.filter(o => o.status === 'cancelled').length,
    percentage: Math.round(percentage * 10) / 10, // 1 decimal
    required_percent: requiredPercent,
    is_safe: percentage >= requiredPercent,
    classes_to_safety: calculateClassesToSafety(attended, total, requiredPercent),
    can_bunk: calculateCanBunk(attended, total, requiredPercent),
  }
}

// How many more classes to attend to reach required %
function calculateClassesToSafety(
  attended: number,
  total: number,
  required: number
): number {
  if ((attended / total) * 100 >= required) return 0
  // Solve: (attended + x) / (total + x) >= required/100
  // x = ceil((required * total - 100 * attended) / (100 - required))
  const x = Math.ceil(
    (required * total - 100 * attended) / (100 - required)
  )
  return Math.max(0, x)
}

// How many classes can be missed while staying safe
function calculateCanBunk(
  attended: number,
  total: number,
  required: number
): number {
  // Solve: attended / (total + x) >= required/100
  // x = floor(attended * 100/required - total)
  const maxTotal = Math.floor((attended * 100) / required)
  return Math.max(0, maxTotal - total)
}
```

### Attendance Auto-Suggest (Home Page)
```
Trigger: 30 minutes AFTER a class ends (not during)
Location: Home page — stacks as dismissible cards above main content
Content: "[Subject name] ended X min ago. Mark attendance:"
Buttons: [✓ Present] [✗ Absent] [○ Cancelled]

Implementation:
1. On home page load, query today's class_occurrences
2. Filter: status != 'cancelled' AND attendance IS NULL
3. Filter: end_time < (now - 30 minutes)
4. Filter: end_time > (now - 2 hours) [don't show very old ones]
5. Show as stacked cards, most recent first
6. Marking from this card creates/updates occurrence and dismisses card
7. Max 5 cards shown — "and X more" if more
```

### Auto-Absent (Appwrite Function)
```
Runs: Appwrite scheduled function, every hour
Logic:
1. Get settings.auto_absent_hours (default: 48)
2. Find all expected classes where:
   - Class date+time < (now - auto_absent_hours)
   - No class_occurrence exists OR occurrence.attendance IS NULL
3. For each: create/update occurrence with attendance='absent'
4. Log to notifications_log
5. Send Telegram notification if telegram_notify_classes=true for that subject

IMPORTANT: Only auto-absent if class was NOT already marked
Check by querying class_occurrences for that (subject_id, date, start_time)
```

---

## 5. BUNK PLANNER / ATTENDANCE CALCULATOR

```
URL: /tools/attendance-calculator
Accessible from: Subject page, AI chat, home quick actions

Inputs:
- Subject selector (or "All subjects")
- Remaining classes (user can override the calculated value)

Display sections:
1. CURRENT STATUS
   - Attended X / Y classes
   - Current: Z%
   - Required: R%
   - Status: ✅ SAFE or ⚠️ AT RISK or ❌ DANGER

2. SURVIVAL CALCULATOR
   - If attend ALL remaining: (attended + remaining) / (total + remaining) * 100
   - If miss ALL remaining: attended / (total + remaining) * 100
   - Show both results with emoji indicators

3. BUNK PLANNER
   - "You can safely bunk: X classes"
   - Large number display (circular badge)
   - Warning if X = 0: "No bunk margin! Every class is critical."
   - Warning if X <= 2: "Very low margin. Be careful."

4. CUSTOM SCENARIO
   - Slider or input: "I will attend X of remaining Y classes"
   - Real-time result: "Result: Z% — [Safe/At Risk/Danger]"

Formula for remaining classes:
  From semester end date and class_schedules, calculate expected future classes
  = sum of weekly occurrences from today until semester end_date
```

---

## 6. GRADE SYSTEM

### Grade Calculation
```typescript
// src/utils/grades.ts

// Calculate current grade percentage for a subject
function calculateSubjectGrade(exams: Exam[]): {
  percentage: number
  grade: string
  points: number
  earned_marks: number
  total_marks: number
} {
  const withWeightage = exams.filter(e => e.weightage_percent && e.marks_obtained !== null)
  const withoutWeightage = exams.filter(e => !e.weightage_percent && e.marks_obtained !== null)

  if (withWeightage.length > 0) {
    // Weighted average
    const earned = withWeightage.reduce((sum, e) =>
      sum + (e.marks_obtained! / e.marks_total) * e.weightage_percent!, 0)
    const percentage = earned  // already in percent
    return { percentage, ...gradeFromPercent(percentage) }
  } else {
    // Simple average
    const totalObtained = withoutWeightage.reduce((sum, e) => sum + e.marks_obtained!, 0)
    const totalMax = withoutWeightage.reduce((sum, e) => sum + e.marks_total, 0)
    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    return { percentage, ...gradeFromPercent(percentage) }
  }
}

// Get grade from percentage using grade scale
function gradeFromPercent(percent: number, scale: GradeMapping[] = DEFAULT_GRADE_MAPPINGS): {
  grade: string; points: number
} {
  const match = scale
    .sort((a, b) => b.min_percent - a.min_percent)
    .find(m => percent >= m.min_percent)
  return match
    ? { grade: match.grade, points: match.points }
    : { grade: 'F', points: 0 }
}
```

### CGPA Calculator
```typescript
// SPI = (sum of grade_points * credits) / total_credits for one semester
function calculateSPI(subjects: Subject[]): number {
  const completed = subjects.filter(s => s.grade_points !== null && s.credits > 0)
  const totalCredits = completed.reduce((sum, s) => sum + s.credits, 0)
  if (totalCredits === 0) return 0
  const weightedPoints = completed.reduce((sum, s) => sum + s.grade_points! * s.credits, 0)
  return Math.round((weightedPoints / totalCredits) * 100) / 100
}

// CGPA = (sum of SPI * credits_per_semester) / total_credits_all_semesters
function calculateCGPA(semesters: Array<{ spi: number; credits_total: number }>): number {
  const completed = semesters.filter(s => s.spi > 0 && s.credits_total > 0)
  const totalCredits = completed.reduce((sum, s) => sum + s.credits_total, 0)
  if (totalCredits === 0) return 0
  const weighted = completed.reduce((sum, s) => sum + s.spi * s.credits_total, 0)
  return Math.round((weighted / totalCredits) * 100) / 100
}

// What-if calculator: if I score X SPI this semester, CGPA will be?
function whatIfCGPA(
  currentSemesters: Array<{ spi: number; credits_total: number }>,
  hypotheticalSPI: number,
  hypotheticalCredits: number
): number {
  return calculateCGPA([
    ...currentSemesters,
    { spi: hypotheticalSPI, credits_total: hypotheticalCredits }
  ])
}

// To reach target CGPA, what SPI do I need this semester?
function requiredSPI(
  currentSemesters: Array<{ spi: number; credits_total: number }>,
  targetCGPA: number,
  thisCredits: number
): number {
  const currentCredits = currentSemesters.reduce((sum, s) => sum + s.credits_total, 0)
  const currentWeighted = currentSemesters.reduce((sum, s) => sum + s.spi * s.credits_total, 0)
  // Solve: (currentWeighted + x * thisCredits) / (currentCredits + thisCredits) = target
  const x = (targetCGPA * (currentCredits + thisCredits) - currentWeighted) / thisCredits
  return Math.round(x * 100) / 100
}
```

### Grade / Marks Calculator (Modal)
```
Purpose: "What marks do I need in remaining exams to get grade X?"

Inputs: Subject selector, target grade
Display:
  - Current marks summary (all completed exams)
  - Remaining exams list
  - For each target grade: marks needed in final exam
  - Color coding: ✅ Achievable, ⚠️ Hard, ❌ Impossible (needs > max marks)

Formula:
  Let earned = sum of (obtained/total * weightage) for completed exams
  Let remaining_weight = 100 - sum of completed weightages
  target_percent = grade_min_percent (from grade scale)
  needed_in_remaining = (target_percent - earned) / remaining_weight * 100
  Compare needed_in_remaining to max (100) — if > 100, impossible
```

---

## 7. AI / LLM SYSTEM

### Setup
```typescript
// src/lib/ai.ts
import { createGroq } from '@ai-sdk/groq'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

// Daily limit check
async function checkAILimit(): Promise<boolean> {
  const settings = await getSettings()
  const today = new Date().toISOString().split('T')[0]

  // Reset counter if new day (IST)
  if (settings.ai_requests_reset_date !== today) {
    await updateSettings({ ai_requests_today: 0, ai_requests_reset_date: today })
    return true
  }
  return settings.ai_requests_today < 50
}

// Main AI call with Groq → Google fallback
async function callAI(prompt: string, systemPrompt: string): Promise<string> {
  const allowed = await checkAILimit()
  if (!allowed) throw new Error('Daily AI limit reached (50/50). Resets at midnight IST.')

  let provider: 'groq' | 'google' = 'groq'
  let result: string

  try {
    const response = await generateText({
      model: groq('llama-3.1-8b-instant'),  // fast free model
      system: systemPrompt,
      prompt,
      maxTokens: 1000,
    })
    result = response.text
  } catch (groqError) {
    // ANY Groq error → fallback to Google
    provider = 'google'
    const response = await generateText({
      model: google('gemini-1.5-flash'),  // free tier model
      system: systemPrompt,
      prompt,
      maxTokens: 1000,
    })
    result = response.text
  }

  // Increment counter
  await updateSettings({ ai_requests_today: settings.ai_requests_today + 1 })
  // Save to ai_conversations (prune if > 20)
  await saveAIMessage({ role: 'assistant', content: result, provider })
  return result
}
```

### AI Features Implementation

**Natural Language Entity Creation**
```
Examples:
  "Add exam next Tuesday at 2pm for DSA" → parse → Create Exam modal pre-filled
  "Remind me about Physics assignment due Friday" → Create Task
  "I have a meeting Thursday 3pm" → Create Event

Implementation:
  1. Send user message to AI with system prompt explaining app structure
  2. AI returns JSON: { action, entity_type, fields }
  3. App opens appropriate modal pre-filled with parsed fields
  4. User reviews and confirms — never auto-create without confirmation
  5. System prompt includes: current date (IST), current semester, subjects list
```

**Study Recommendations**
```
AI gets context:
  - Current semester subjects with attendance %
  - Upcoming exams (next 7 days)
  - Overdue tasks
  - Recent weak subjects (lowest marks)

System prompt:
  "You are a university study assistant. Be concise, practical, and encouraging.
   Give specific actionable advice based on the student's actual data."
```

**Conflict Detection**
```
Check (can be done client-side, no AI needed):
  - Exam + deadline on same day: warn
  - Two exams same day: warn
  - Deadline within 48h of exam: warn
  - 3+ deadlines in 48h window: warn (smart deadline warning)

Show as:
  - Red warning badge on home page
  - Alert in AI chat if mentioned
  - Notification via Telegram (once per conflict)
```

**Goal Progress Check**
```
User asks: "Am I on track for 8.5 SPI?"
AI gets: current grades, attendance, upcoming exams, semester goals
AI calculates: projection based on current trends + gives advice
```

**Smart Deadline Warning** (home page, no AI needed)
```
Check every page load:
  - Find all tasks and exams in next 48 hours
  - If count >= 3: show warning banner on home
  - "⚠️ 3 deadlines in the next 48 hours!"
  - Click → show list of those items
```

**Time to Exam Countdown** (on exam cards)
```
display: "3 days 4 hours" or "Tomorrow at 10:00 AM" or "In 2 hours"
Calculation: exam.date + exam.start_time - now() in IST
Show on: exam cards, home page upcoming section, AI chat
Color: green (>7 days), yellow (3-7 days), orange (1-3 days), red (<1 day)
```

### AI Chat Context System Prompt Template
```
You are Classey's AI assistant for a university student.
Current date and time: {IST datetime}
Current semester: {semester.name} (ends {semester.end_date})
Subjects: {subjects list with attendance % and current grade}
Upcoming exams (7 days): {exam list}
Pending tasks: {task count and overdue count}
Attendance concerns: {subjects below required %}
AI requests remaining today: {50 - ai_requests_today}/50

Be concise, practical, and specific. Use the student's actual data.
Format responses with clear sections when needed.
Do not make up information not provided above.
```

---

## 8. NOTIFICATION SYSTEM

### Telegram Bot Setup
```
URL: /api/telegram/webhook
Method: POST
Appwrite sends webhook OR Next.js handles scheduling

User setup flow:
1. User opens settings → Notifications → Telegram
2. Instructions: "Create a bot via @BotFather on Telegram"
3. Enter bot token → app saves to env var (or settings)
4. User sends any message to their bot → app gets chat_id
5. Save chat_id to settings.telegram_bot_chat_id
6. Test button: sends test message to confirm setup

Notification triggers (server-side, called from API routes):
  - Exam tomorrow: morning of (10 AM IST)
  - Assignment due in 24h
  - Task deadline in 24h
  - Pre-class reminder: X minutes before class (if enabled per-subject)
  - Auto-absent marked: notify user they were marked absent
```

```typescript
// src/lib/telegram.ts
import TelegramBot from 'node-telegram-bot-api'

async function sendTelegramMessage(chatId: string, message: string): Promise<void> {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN!, { polling: false })
  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
}

// Message format examples:
// "📝 *Quiz 2 - DSA* is tomorrow at 10:00 AM\n_Good luck! You scored 85% on Quiz 1_"
// "⚠️ *Physics Assignment* is due in 24 hours\n_You have 3 pending tasks today_"
// "📚 *Data Structures* class in 15 minutes\n_Room 301, Slot 1A_"
```

### Web Push Notifications
```
Using Appwrite Messaging (built-in, no extra setup)
Default: OFF for all notification types
User enables in settings
Requires browser permission prompt on first enable
Works on Chrome, Firefox, Edge, Safari 16.4+
```

---

## 9. UNDO SYSTEM

```
Every destructive or reversible action must offer Undo.
5-second window via Sonner toast.

Actions requiring Undo:
  - Mark attendance (present/absent/cancelled)
  - Complete task
  - Delete any entity (semester, subject, exam, task, event)
  - Cancel class
  - Mark holiday (bulk cancels classes)

Implementation pattern:
1. Perform action optimistically in UI (TanStack Query optimistic update)
2. Show Sonner toast: "Marked as Absent. [Undo]" duration: 5000ms
3. If user clicks Undo within 5 seconds: revert operation
4. If toast times out: action is confirmed (Appwrite write already done)

For deletes: use soft delete (set deleted_at) so undo just clears deleted_at
For attendance: store previous value before update, revert if undo clicked
```

---

## 10. GLOBAL SEARCH (Cmd+K)

```typescript
// Built with CMDK
// Searches across these collections simultaneously:

const searchTargets = [
  { collection: 'subjects',       fields: ['name', 'short_name', 'code'], icon: BookOpen },
  { collection: 'exams',          fields: ['name', 'syllabus'],           icon: FileText },
  { collection: 'tasks',          fields: ['title', 'description'],       icon: CheckSquare },
  { collection: 'files',          fields: ['file_name', 'description'],   icon: File },
  { collection: 'notes',          fields: ['content'],                    icon: StickyNote },
  { collection: 'resource_links', fields: ['title', 'url'],               icon: Link },
  { collection: 'events',         fields: ['title', 'description'],       icon: Calendar },
]

// Group results by type with count
// Keyboard: ↑↓ navigate, Enter select, Esc close
// Recent searches: localStorage 'classey_recent_searches' (last 5)
// Fuzzy matching: use fuse.js or simple includes() for each field
// Min query length: 2 characters before searching
// Debounce: 150ms
```

---

## 11. FREE TIME FINDER

```
Button on home page: "Find Free Time Today"
Logic:
1. Get today's class_schedules for current semester (active schedules)
2. Get today's events
3. Build timeline of busy blocks (class start → class end, event start → event end)
4. Find gaps >= 75 minutes (1h 15min) between busy blocks
5. Also check against 8:00 AM start and 10:00 PM end boundaries
6. Display: "You're free 3:00 PM – 5:00 PM (2 hours)" per gap
7. If no gaps: "Busy day! No free slots over 1h 15min today."
8. Multiple gaps: show all, sorted chronologically

Free time gap calculation:
  Sort all events by start time
  Iterate: if gap between event[i].end and event[i+1].start >= 75 min → free slot
  Include leading gap (midnight to first event) if >= 75 min from 8AM
  Include trailing gap (last event to 10PM) if >= 75 min
```

---

## 12. SMART DEFAULTS (All Create Modals)

```
Auto-fill intelligently based on context:

Create Exam modal:
  - subject_id: currently viewed subject (if opened from subject page)
  - date: tomorrow (most common use case)
  - start_time: 10:00 (common exam time)
  - type: 'quiz' (most common)

Create Task modal:
  - semester_id: current active semester
  - subject_id: currently viewed subject (if applicable)
  - deadline: tomorrow 11:59 PM
  - priority: 'medium'

Create Event modal:
  - start_datetime: today at next round hour (e.g. if 2:35 PM → 3:00 PM)
  - end_datetime: start + 1 hour

Create Subject modal:
  - semester_id: current active semester
  - color: semester color (can override)
  - type: 'theory'
  - credits: 3 (most common)

Mark Attendance:
  - Pre-select: 'present' (most common action)
```

---

## 13. WEEKLY ACADEMIC SUMMARY

```
URL: /analytics/weekly-summary
Also triggered by: AI chat, Telegram (weekly notification)

Data gathered for current week (Mon–Sun):
1. ATTENDANCE
   - Classes scheduled this week
   - Classes attended / missed / cancelled
   - % vs last week (trend)

2. TASKS
   - Completed count
   - Pending count
   - Overdue count

3. EXAMS
   - Exams taken (with scores)
   - Upcoming exams this week

4. AI INSIGHT
   - 1-2 sentence AI summary of the week
   - Specific actionable advice
   - Only calls AI if user opens this page (not automatic)

Week boundaries: Monday 00:00 IST → Sunday 23:59 IST
Navigation: [← Previous Week] [Next Week →]
```

---

## 14. SEMESTER INSIGHTS / ANALYTICS

```
URL: /semester/[id]/analytics

Sections:
1. ATTENDANCE OVERVIEW
   - Bar chart: all subjects attendance %
   - Best subject (highest %) with 🏆
   - Worst subject (lowest %) with ⚠️
   - Subjects below required % in red

2. EXAM PERFORMANCE
   - Line chart: exam score trends per subject
   - Best and worst performing subjects
   - Average across all subjects

3. PATTERNS (computed, no AI)
   - Most missed day of week (which day has highest absent rate)
   - Correlation: high attendance → higher scores
   - Task completion rate

4. AI RECOMMENDATIONS (on-demand, user clicks button)
   - AI analyzes all the above data
   - Returns 3-5 specific recommendations
   - Example: "Focus on Math — attendance 62%, 5 classes to reach 75%"
```

---

## 15. CGPA TRACKER

```
URL: /analytics/cgpa

Display:
1. Current CGPA (large number, animated counter on load)
2. Line chart: CGPA trend across all semesters
3. Semester breakdown table: name, SPI, credits, status
4. WHAT-IF CALCULATOR
   - Input: "If I score [___] SPI this semester"
   - Output: "Your CGPA will be: X.XX"
   - Input: "To reach CGPA [___]"
   - Output: "You need SPI: X.XX this semester"
   - Color: green if achievable, red if impossible (> spi_scale)

SPI input modes:
  - Quick: user just enters SPI manually for past semesters
  - Detailed: calculated from subjects and grades (current semester)
  - Both available for any semester
```

---

## 16. FILE SYSTEM

### File Upload Flow
```
1. User drags/drops or selects file
2. Validate: check allowed extensions and max size
3. Upload to Appwrite Storage → get storage_file_id
4. Create Files collection document linking storage_file_id to context
5. Show progress bar during upload
6. On success: show file in list
7. On failure: delete orphaned storage file, show error toast

Allowed types:
  Documents: pdf, txt, doc, docx, ppt, pptx, xls, xlsx
  Code: py, js, ts, c, cpp, h, java
  Images: jpg, jpeg, png, gif, webp

Context linking (can link to multiple):
  - Subject level (general)
  - Specific exam (exam prep, answer sheets)
  - Specific task (assignment submission)
  - Specific class occurrence (class notes)
  - Event (event documents)
```

### Smart File Linking
```
When user uploads a file, show context selector:
  "Link this file to:" 
  → This subject (general)
  → A specific exam [dropdown]
  → A specific task [dropdown]  
  → A specific class date [date picker]
  → An event [dropdown]

is_past_paper flag:
  Toggle in file upload modal: "This is a past exam paper"
  Past papers shown separately in Subject Files tab with 📄 icon
```

---

## 17. DATA EXPORT

```
URL: /settings → Export section

Options:
  Format: JSON or CSV
  Scope: checkboxes for each collection to include
  
JSON export:
  - Single file: classey-export-{date}.json
  - Contains all selected collections as arrays
  - Includes metadata: export_date, app_version

CSV export:
  - ZIP file with one CSV per collection
  - Human-readable column headers

After export:
  - Create backups collection document
  - Show in Settings → Backup History
  - Allow re-download from backup history
```

---

## 18. TIMETABLE EXPORT (Image)

```
URL: Modal from semester page

Options:
  Period: This week / Full semester / Custom date range
  Format: PNG / JPG / PDF
  Include: Room numbers toggle, Teacher names toggle
  Style: Dark / Light / Accent color

Implementation:
  - Render a hidden div with the timetable grid
  - Use html2canvas to capture as image
  - Or use jsPDF for PDF export
  - Show preview before download

Timetable grid:
  Columns: Mon, Tue, Wed, Thu, Fri, (Sat if applicable)
  Rows: Time slots (e.g. 8:00 AM to 9:00 PM)
  Cells: Subject short_name + room (if enabled)
  Colors: Each subject's color
```

---

## 19. HOLIDAY SYSTEM

```
When user creates a holiday:
1. Create holiday document
2. Fetch all class_schedules that have classes on that date
3. For each affected schedule: create/update class_occurrence with:
   - status = 'cancelled'
   - cancellation_reason = 'Holiday: {holiday.name}'
4. Show confirmation: "Holiday created. 5 classes cancelled."
5. All cancelled classes excluded from attendance calculations

Multi-day holidays:
  - date_end is set
  - Run the above logic for each day in the range
```

---

## 20. EXTRA CLASS SYSTEM

```
User adds an extra class for a subject (one-time, not recurring):
1. User clicks "Add Extra Class" on subject or calendar page
2. Modal: select subject, date, start time, end time, room (optional)
3. Creates class_occurrence with:
   - is_extra_class = true
   - schedule_id = null
   - status = 'scheduled'
   - attendance = null
4. Appears on calendar like a regular class
5. User can mark attendance for it normally
6. Counts toward attendance calculation
```

---

## 21. RESOURCE LINKS

```
Per-subject saved links (YouTube, Notion, Drive, GitHub, etc.)

Auto-detect type from URL:
  youtube.com / youtu.be → 'youtube' (fetch thumbnail from YouTube API or oEmbed)
  notion.so → 'notion'
  drive.google.com → 'drive'
  github.com → 'github'
  else → 'website'

Display in subject page:
  Grid of link cards with favicon/thumbnail
  Click → open in new tab
  Can also link to specific exam
```

---

## 22. TAGS SYSTEM

```
Universal tagging — any entity can have tags

Pre-suggest tags: "important", "revision", "exam-prep", "urgent"
User can create custom tags with custom colors
Tags shown as colored badges on cards
Filter by tag: click tag anywhere → filters list to items with that tag
Max 5 tags per entity
```

---

## 23. CONTEXT MENUS

```
Desktop: Right-click on any card → context menu
Mobile: Long press (500ms) on any card → context menu (or action sheet)

Semester card context menu:
  Edit | Archive | Delete | View Analytics

Subject card context menu:
  Edit | Mark All Present (today) | Add Extra Class | Delete

Task card context menu:
  Edit | Mark Complete | Change Priority | Delete

Exam card context menu:
  Edit | Add Marks | View Detail | Delete

Use Radix UI ContextMenu for desktop implementation
Use custom bottom sheet (Vaul) for mobile long-press menu
```

---

## 24. ATTACH FILES ANYWHERE

```
Attachment button available on:
  - Create/Edit Task modal
  - Create/Edit Exam modal
  - Create/Edit Event modal
  - Class detail view

Click "Attach" → open file picker
  Option A: Upload new file
  Option B: Link existing file from Files collection
Display: small file chip below the entity with filename + icon
Click chip: download/preview file
Remove: × button on chip
```

---

## 25. PAST SEMESTERS (Quick Input Mode)

```
When creating a past semester (status='completed'), user sees two options:
  Option A: "Quick Input" — just enter SPI and credits
    - is_quick_input = true
    - No subjects, no detailed tracking
    - Shows in CGPA tracker with SPI value
  Option B: "Detailed Tracking" — add subjects with grades
    - is_quick_input = false
    - Full subject/grade entry
    - Calculates SPI automatically

Both options appear in CGPA tracker and semester breakdown table
User can switch from Quick to Detailed at any time (adds subjects)
```