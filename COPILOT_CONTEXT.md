# Classey — Copilot Context (Daily Progress Tracker)

**UPDATE THIS FILE every time you start or end a coding session.**
Reference it at the start of every Copilot conversation:
> "@workspace Read #file:COPILOT_CONTEXT.md before we begin."

---

## 📍 Current Status

**Last Updated:** 2026-04-04
**Current Phase:** Phase 1 — Foundation
**Active Branch:** main

---

## ✅ Completed

Nothing yet — fresh start.

---

## 🔄 In Progress

### Phase 1 — Foundation
- [ ] Next.js 15 project setup (already scaffolded)
- [ ] Install all dependencies (see package list below)
- [ ] Configure Tailwind CSS 4 + CSS variables (--accent system)
- [ ] Configure TypeScript paths (@/ alias)
- [ ] Set up Appwrite Cloud project + create all 23 collections
- [ ] Fill in .env.local with real values
- [ ] Password gate — /auth page + middleware
- [ ] Auth cookie system (httpOnly, 30-day, signed)
- [ ] Theme system (dark/light + accent color CSS variable)
- [ ] All 5 background animations
- [ ] Global layout (dock nav + AI bubble placeholder + Sonner)
- [ ] Settings page + settings Appwrite collection
- [ ] Pre-seed default slots (15 regular + lab + extra)
- [ ] Pre-seed default grade scale (A=10, B=9...)

---

## 📌 Next Up (Phase 2)

- Semester CRUD (create, edit, delete, archive)
- Subject CRUD (with slot picker)
- Class schedules auto-generation from slots
- Semester detail page
- Subject detail page (tabbed)

---

## 🗺️ Full Phase Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation: setup, auth, theme, backgrounds, settings | 🔄 In Progress |
| 2 | Semester + Subject CRUD | ⏳ Not Started |
| 3 | Slot system + Class schedules | ⏳ Not Started |
| 4 | Dashboard + Weekly Calendar (FullCalendar) | ⏳ Not Started |
| 5 | Attendance marking + Auto-absent Appwrite Function | ⏳ Not Started |
| 6 | Exams + Tasks + Personal Events | ⏳ Not Started |
| 7 | Analytics: CGPA, Bunk planner, Grade calculator | ⏳ Not Started |
| 8 | Files, Resource links, Notes | ⏳ Not Started |
| 9 | AI chat (Groq + Google fallback) | ⏳ Not Started |
| 10 | Notifications (Telegram Bot + Web Push) | ⏳ Not Started |
| 11 | Export, Global Search (Cmd+K), Undo system, Polish | ⏳ Not Started |
| 12 | Edge cases, performance, final responsive QA | ⏳ Not Started |

---

## 🐛 Known Issues

_None yet. Add issues here as you find them._

Format:
- [ ] Issue description (file: src/path/to/file.tsx, line ~XX)

---

## ⚠️ Do Not Touch

_Files/areas that are currently fragile or being worked on by another session._

_None yet._

---

## 🏗️ Architecture Decisions Log

_Record WHY decisions were made so Copilot doesn't second-guess them._

| Decision | Choice | Reason |
|----------|--------|--------|
| Auth method | ENV password + httpOnly cookie | Single-user app, simple and secure |
| Mobile strategy | Responsive web only | Not a native app — decided Apr 4 |
| State: server data | TanStack Query only | Never in Zustand |
| State: UI state | Zustand only | Never fetch in useEffect |
| Soft deletes | deleted_at field on all collections | Supports undo, preserves history |
| Slot occurrences | Generated on-demand | Pre-generating = thousands of records |
| AI fallback | Groq → Google on ANY error | Seamless, user never sees provider switch |
| Telegram bot | Next.js API route /api/telegram | Free, same codebase, easy to debug |
| Background default | Spooky smoke animation | Confirmed in plan.md |
| Week start | Monday | Confirmed in plan.md, configurable |
| Time format | 24h | Default, configurable in settings |
| Timezone | Asia/Kolkata (IST) | Default, configurable in settings |

---

## 📦 Dependencies to Install

Run this after scaffolding the Next.js project:

```bash
# UI & Animation
pnpm add framer-motion @radix-ui/react-dialog vaul cmdk sonner

# shadcn/ui (run separately for each component)
pnpm dlx shadcn@latest init

# Appwrite
pnpm add appwrite

# State & Data fetching
pnpm add zustand @tanstack/react-query

# Forms & Validation
pnpm add react-hook-form zod @hookform/resolvers

# Calendar
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# Charts
pnpm add recharts

# Date handling
pnpm add date-fns date-fns-tz

# AI SDK
pnpm add ai @ai-sdk/groq @ai-sdk/google

# Telegram Bot
pnpm add node-telegram-bot-api
pnpm add -D @types/node-telegram-bot-api

# Utilities
pnpm add fuse.js html2canvas jspdf

# Dev dependencies
pnpm add -D @types/node
```

---

## 🔑 Appwrite Collections to Create

Create these in Appwrite Console in this order (FK dependencies):

| Order | Collection | Depends On |
|-------|------------|------------|
| 1 | settings | — |
| 2 | grade_scales | — |
| 3 | slots | — |
| 4 | semesters | — |
| 5 | subjects | semesters |
| 6 | class_schedules | subjects, slots |
| 7 | class_occurrences | subjects, class_schedules |
| 8 | exams | subjects |
| 9 | tasks | subjects, semesters |
| 10 | events | semesters |
| 11 | holidays | — |
| 12 | resource_links | subjects, exams |
| 13 | files | subjects, exams, tasks, events, class_occurrences |
| 14 | notifications_log | — |
| 15 | audit_log | — |
| 16 | tags | — |
| 17 | tagged_items | tags |
| 18 | study_sessions | subjects, tasks |
| 19 | goals | semesters, subjects |
| 20 | notes | subjects, class_occurrences |
| 21 | backups | — |
| 22 | widgets_config | — |
| 23 | ai_conversations | — |

All collection IDs → copy into .env.local after creating in Appwrite Console.

---

## 🎨 Appwrite Storage

Create ONE storage bucket:
- Name: classey-files
- Allowed file types: pdf, txt, doc, docx, ppt, pptx, xls, xlsx, py, js, ts, c, cpp, h, java, jpg, jpeg, png, gif, webp
- Max file size: 50MB
- Bucket ID → copy into .env.local as NEXT_PUBLIC_APPWRITE_BUCKET_ID

---

## 💬 Useful Copilot Prompts (Copy-Paste Ready)

### Start any session
```
@workspace Read #file:COPILOT_CONTEXT.md and #file:.github/copilot-instructions.md
before we begin. I want to continue working on [describe task].
```

### Build a new page
```
/create-page
```

### Build a component
```
/create-component
```

### Build a modal
```
/create-modal
```

### Set up an Appwrite collection + hooks
```
/appwrite-collection
```

### Review UI quality
```
/ui-review
Check #file:src/components/[component-file].tsx against all Classey UI standards.
```

### Fix TypeScript errors
```
@workspace Check #problems and fix all TypeScript errors in the files we just
created. Do not modify any files outside of those we built this session.
```

### Cross-file feature implementation
```
@workspace I'm implementing [feature name]. Read:
- #file:COPILOT_CONTEXT.md
- #file:.github/skills/classey-features/SKILL.md (section: [feature])
- #file:.github/skills/classey-database/SKILL.md (collections: [list])
Then implement it step by step. Stop after each file and wait for confirmation.
```

---

## 📝 Session Notes

_Add notes here during development. Clear old notes when phase completes._

```
[2026-04-04] Project setup complete. Skills and config files in place.
Ready to begin Phase 1 implementation.
```