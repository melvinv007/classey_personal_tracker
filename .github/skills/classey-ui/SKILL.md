---
name: classey-ui
description: >
  Classey-specific UI/UX implementation skill. Load this skill when building
  ANY component, page, modal, card, animation, background, chart, or anything
  visual in the Classey app. Contains exact CSS values, animation specs,
  color system rules, component patterns, and responsive behavior for every
  UI element. Triggers: 'build', 'create', 'style', 'design', 'component',
  'card', 'modal', 'background', 'animation', 'theme', 'color', 'responsive',
  'layout', 'chart', 'calendar', 'toast', 'UI', 'UX', 'glassmorphism',
  'glowing', 'dock', 'button', 'form', 'input', 'page', 'screen'.
---

# Classey UI/UX Implementation Skill

This skill contains the exact implementation details for every visual element
in Classey. Always follow these values precisely — do not improvise.

---

## 1. CSS Variable System (Semester Accent Colors)

Every semester has a hex color. That color must propagate to the ENTIRE page
via CSS custom properties. This is the heart of Classey's dynamic theming.

### Root Variables (in globals.css)
```css
:root {
  /* Set dynamically by ThemeStore when semester changes */
  --accent: 139 92 246;          /* RGB values (not hex) for opacity support */
  --accent-hex: #8B5CF6;         /* Full hex for properties that need it */
  --accent-foreground: 255 255 255;

  /* Dark theme base */
  --background: 9 9 11;
  --foreground: 250 250 250;
  --card: 255 255 255 / 0.05;
  --card-border: 255 255 255 / 0.10;
  --muted: 255 255 255 / 0.06;
  --muted-foreground: 255 255 255 / 0.50;
  --popover: 20 20 27;
  --border: 255 255 255 / 0.10;
  --input-bg: 255 255 255 / 0.06;
  --ring: var(--accent);
}

.light {
  --background: 252 252 253;
  --foreground: 9 9 11;
  --card: 0 0 0 / 0.03;
  --card-border: 0 0 0 / 0.08;
  --muted: 0 0 0 / 0.05;
  --muted-foreground: 0 0 0 / 0.50;
  --border: 0 0 0 / 0.10;
  --input-bg: 0 0 0 / 0.04;
}
```

### How to apply accent color anywhere
```tsx
// Tailwind — use arbitrary values with CSS var
className="bg-[rgb(var(--accent))] text-[rgb(var(--accent-foreground))]"
className="border-[rgba(var(--accent),0.3)]"
className="shadow-[0_0_20px_rgba(var(--accent),0.15)]"

// Inline style — when Tailwind can't handle it
style={{ color: `rgb(var(--accent))` }}
style={{ boxShadow: `0 0 20px rgba(var(--accent), 0.2)` }}

// In Recharts — pass as prop
stroke={`rgb(var(--accent))`}
fill={`rgba(var(--accent), 0.15)`}

// In FullCalendar — via eventColor prop
eventColor={`rgb(var(--accent))`}
```

### Setting accent color when semester changes (ThemeStore)
```tsx
// In theme-store.ts — call this when active semester changes
function setAccentColor(hexColor: string) {
  const r = parseInt(hexColor.slice(1, 3), 16)
  const g = parseInt(hexColor.slice(3, 5), 16)
  const b = parseInt(hexColor.slice(5, 7), 16)
  document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`)
  document.documentElement.style.setProperty('--accent-hex', hexColor)
}
```

---

## 2. Glassmorphism — Exact Values

### Standard Card (Semester, Subject, Stats, Task, Event, Exam)
```tsx
// Tailwind classes
className="
  bg-white/5 dark:bg-white/5
  backdrop-blur-xl
  border border-white/10
  rounded-2xl
"

// Equivalent CSS
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255, 255, 255, 0.10);
border-radius: 16px;
```

### Elevated Surface (Modals, Dropdowns, Popovers)
```tsx
className="
  bg-white/8 dark:bg-white/8
  backdrop-blur-2xl
  border border-white/12
  rounded-3xl
"

// Equivalent CSS
background: rgba(255, 255, 255, 0.08);
backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.12);
border-radius: 20px;
```

### Subtle Surface (Sidebars, Panels, Input backgrounds)
```tsx
className="
  bg-white/3 dark:bg-white/3
  backdrop-blur-md
  border border-white/8
  rounded-xl
"
```

### Light mode glassmorphism
```tsx
// Light mode — use black base instead of white
className="
  bg-black/3 dark:bg-white/5
  backdrop-blur-xl
  border border-black/8 dark:border-white/10
  rounded-2xl
"
```

---

## 3. Glowing Border Effect (Semester + Subject Cards)

```tsx
// Apply via inline style — Tailwind can't do multi-shadow well
style={{
  boxShadow: `
    0 0 0 1px rgba(var(--accent), 0.3),
    0 0 20px rgba(var(--accent), 0.15),
    0 0 40px rgba(var(--accent), 0.05)
  `
}}

// On hover — increase intensity
// Use Framer Motion whileHover for this:
<motion.div
  style={{ boxShadow: glowShadow }}
  whileHover={{
    boxShadow: `
      0 0 0 1px rgba(var(--accent), 0.5),
      0 0 30px rgba(var(--accent), 0.25),
      0 0 60px rgba(var(--accent), 0.10)
    `
  }}
  transition={{ duration: 0.15 }}
>
```

---

## 4. Animation System (Framer Motion)

### Standard Card Entrance (use for ALL cards on page load)
```tsx
import { motion } from 'framer-motion'

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 }
}

// Single card
<motion.div
  variants={cardVariants}
  initial="hidden"
  animate="visible"
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>

// Staggered list of cards
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
}

<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={cardVariants}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
    </motion.div>
  ))}
</motion.div>
```

### Modal Entrance/Exit
```tsx
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 }
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
}

// Always use AnimatePresence for exit animations
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div  // overlay
        variants={overlayVariants}
        initial="hidden" animate="visible" exit="exit"
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      <motion.div  // modal
        variants={modalVariants}
        initial="hidden" animate="visible" exit="exit"
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="fixed ... z-50"
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### Page Transition
```tsx
// Wrap page content in this
const pageVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 }
}

<motion.main
  variants={pageVariants}
  initial="hidden"
  animate="visible"
  exit="exit"
  transition={{ duration: 0.3, ease: 'easeInOut' }}
>
```

### Micro-interactions (hover, tap, toggle)
```tsx
// Button tap
<motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.02 }}
  transition={{ duration: 0.15 }}>

// Toggle switch
<motion.div animate={{ x: isOn ? 20 : 0 }} transition={{ type: 'spring',
  stiffness: 500, damping: 30 }}>

// Attendance quick-mark buttons (scale pulse on mark)
<motion.button
  whileTap={{ scale: 0.9 }}
  animate={justMarked ? { scale: [1, 1.15, 1] } : {}}
  transition={{ duration: 0.3 }}>

// Task checkbox fade-out after completion (5 second delay)
<motion.div
  animate={isCompleted ? { opacity: 0, height: 0 } : { opacity: 1 }}
  transition={{ delay: 5, duration: 0.4, ease: 'easeOut' }}>
```

### Swipe to Complete (Tasks — mobile touch)
```tsx
// Use Framer Motion drag for mobile swipe-to-complete
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 80 }}
  dragElastic={0.2}
  onDragEnd={(_, info) => {
    if (info.offset.x > 60) onComplete(task.id)
  }}
>
```

### Long Press (Cards — mobile)
```tsx
// Use pointer events for long press (500ms)
const longPressTimeout = useRef<NodeJS.Timeout>()

onPointerDown={() => {
  longPressTimeout.current = setTimeout(() => onLongPress(), 500)
}}
onPointerUp={() => clearTimeout(longPressTimeout.current)}
onPointerLeave={() => clearTimeout(longPressTimeout.current)}
```

---

## 5. Backgrounds (All 5 Options)

### Spooky Smoke (Default) — CSS animation
```tsx
// Component: src/components/backgrounds/SpookySmokeBackground.tsx
// Source reference: 21st.dev/easemize/spooky-smoke-animation
// Implement as layered radial gradients with CSS keyframe animation
// Use multiple pseudo-elements with different animation-delay values
// Colors should use --accent CSS variable with low opacity (0.05-0.15)
// Animation: slow drift, 8-15 second cycles, linear infinite

export function SpookySmokeBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Implement smoke layers here */}
      {/* Each layer: absolute positioned div with radial-gradient */}
      {/* Animate: translate + opacity, different timings per layer */}
    </div>
  )
}
```

### Dotted Surface — CSS background-image
```tsx
export function DottedBackground() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        backgroundImage: `radial-gradient(rgba(var(--accent), 0.15) 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    />
  )
}
```

### Boxes — Animated grid
```tsx
// Reference: shadcn.io/background/boxes
// Animated colored grid boxes that glow with accent color
export function BoxesBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Grid of small boxes, some highlighted with accent color */}
      {/* Animate highlight cycling across boxes */}
    </div>
  )
}
```

### Dot Pattern — Static
```tsx
export function DotPatternBackground() {
  return (
    <svg className="fixed inset-0 -z-10 h-full w-full stroke-white/10">
      <defs>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="rgba(var(--accent), 0.3)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  )
}
```

### Noise Grid
```tsx
// Reference: ui.aceternity.com/background-noise-grid
// Use SVG feTurbulence filter for noise texture
export function NoiseGridBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <svg className="h-full w-full opacity-20">
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  )
}
```

---

## 6. Navigation Dock

```
Reference: 21st.dev/jatin-yadav05/minimal-dock
Behavior: Minimal, icon-only on mobile, icon+text on desktop
Position: Fixed bottom on mobile, fixed left-side or bottom on desktop
Background: Glassmorphism (bg-white/8 backdrop-blur-2xl)
```

### Dock items
| Icon | Label | Route |
|------|-------|-------|
| Home | Home | / |
| Calendar | Calendar | /calendar |
| CheckSquare | Tasks | /tasks |
| BarChart2 | Analytics | /analytics/cgpa |
| FolderOpen | Files | /files |
| Settings | Settings | /settings |

### Floating AI Bubble
```tsx
// Fixed bottom-right, always on top (z-50)
// Small circular button with AI/sparkle icon
// Glassmorphism + accent color glow
// Click → opens AI chat panel (slide up from bottom)
// Badge shows daily usage count when > 0
<motion.button
  className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full
    bg-[rgba(var(--accent),0.2)] backdrop-blur-xl
    border border-[rgba(var(--accent),0.4)]
    flex items-center justify-center"
  style={{ boxShadow: `0 0 20px rgba(var(--accent), 0.3)` }}
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.95 }}
>
```

---

## 7. Card Components

### Semester Card
```
Style: Glassmorphism + glowing border (accent color)
Size: Responsive — full width on mobile, grid on desktop
Shows: Semester name, date range, SPI, status badge, subject count
Interactions:
  - Click → navigate to /semester/[id]
  - Long press / right-click → context menu (edit, delete, archive)
  - Hover → glow intensity increases
Status badge colors:
  - ongoing: accent color
  - upcoming: blue
  - completed: green
  - archived: muted gray
```

### Subject Card
```
Style: Glassmorphism + glowing border (subject or semester accent color)
Shows: Subject name, short name, attendance %, circular progress ring,
       next class time, credits
Circular progress ring:
  - Green if >= attendance requirement
  - Yellow if within 5% of requirement
  - Red if below requirement
  - Color always uses accent tint, threshold colors override
Interactions: same as Semester Card
```

### Stats Card
```
Style: Glassmorphism, no glow border
Shows: Large number + label + trend arrow
Examples: "78%" attendance, "8.7" SPI, "12" tasks due
Trend: small arrow up/down with % change from last period
```

### Task Card
```
Style: Lighter glassmorphism (bg-white/3)
Shows: Title, subject tag, deadline, priority indicator
Mobile: Swipe right → complete (green reveal)
Desktop: Checkbox on left
5-second fade-out after completion
Priority colors: high=red, medium=yellow, low=muted
```

### Quick Actions Card (Home — Attendance Auto-suggest)
```
Shows: "[Subject name] class ended X minutes ago. Mark attendance:"
Buttons: [Present ✓] [Absent ✗] [Cancelled ○]
Appears: 30 min after class end, only if not already marked
Stacks: Multiple missed classes stack as separate cards
Dismisses: After marking OR after 2 hours
Animation: Slide in from top, slide out after action
```

---

## 8. Modal System

### Structure (ALL modals follow this)
```tsx
// Always use Vaul for bottom sheet on mobile
// Always use Dialog (centered) on desktop
// Detect mobile with useMediaQuery hook

export function CreateExamModal({ isOpen, onClose }: CreateExamModalProps) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (isMobile) {
    return <Vaul.Root open={isOpen} onOpenChange={onClose}>
      <Vaul.Content className="bg-white/8 backdrop-blur-2xl border-t border-white/12
        rounded-t-3xl px-6 pb-8 pt-4 max-h-[90vh] overflow-y-auto">
        {/* Modal content */}
      </Vaul.Content>
    </Vaul.Root>
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} />
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              z-50 w-full max-w-lg bg-white/8 backdrop-blur-2xl
              border border-white/12 rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Modal content */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

### All 16 Modals to implement
1. Create Semester (with quick SPI input option for past semesters)
2. Edit Semester
3. Create Subject (with slot picker: full slot / sub-slots / manual)
4. Edit Subject
5. Create Exam
6. Edit Exam
7. Create Task
8. Edit Task
9. Create Personal Event
10. Create Holiday (cancels all classes on that day automatically)
11. Grade Calculator (what score needed for target grade)
12. Timetable Export (PNG/JPG/PDF with options)
13. Confirmation (delete actions — always require explicit confirm)
14. Create/Edit Slot (in settings)
15. Grade Scale Editor (in settings)
16. Password/PIN Setup (first visit — beautiful, animated, themed)

---

## 9. Form Inputs — Styling Rules

```tsx
// Text input base style
className="
  w-full px-4 py-2.5 rounded-xl
  bg-white/6 dark:bg-white/6
  border border-white/10
  text-foreground placeholder:text-white/30
  focus:outline-none focus:ring-2 focus:ring-[rgba(var(--accent),0.5)]
  focus:border-[rgba(var(--accent),0.5)]
  transition-all duration-150
"

// Select/Dropdown — same base, use Radix Select from shadcn
// Toggle switch — use custom animated toggle, not default HTML checkbox
// Color picker — presets grid (10 colors) + custom hex input
// DateTime picker — reference: 21st.dev/BelkacemYerfa/datetime-picker
// Multi-select — for sub-slot selection in Create Subject modal
// Slot picker — custom dropdown showing slot preview (day+time grid)
```

---

## 10. Charts — Theme Rules

```tsx
// ALL charts must use these colors derived from CSS variables
const chartColors = {
  primary: `rgb(var(--accent))`,
  primaryLight: `rgba(var(--accent), 0.15)`,
  muted: `rgba(var(--foreground), 0.3)`,
  grid: `rgba(var(--foreground), 0.08)`,
  text: `rgba(var(--foreground), 0.6)`,
}

// Circular Progress Ring (attendance) — SVG based
// stroke: accent color if safe, yellow if warning, red if danger
// Always show percentage in center

// Line chart (CGPA trend, exam trends)
// Area fill: primaryLight
// Line stroke: primary
// Dots: filled with primary
// Grid lines: chartColors.grid
// Axis text: chartColors.text

// Bar chart (subject comparisons)
// Bar fill: primary (use opacity for inactive bars)
// Hover: increase opacity + glow effect
```

---

## 11. Global Search (Cmd+K)

```tsx
// Built with CMDK
// Trigger: Cmd+K (Mac) / Ctrl+K (Windows/Linux)
// Style: Glassmorphism modal, full-screen overlay on mobile
// Search across: subjects, exams, tasks, files, notes, resource links
// Show results grouped by type with icons
// Keyboard navigation: arrow keys + enter
// Recent searches: stored in localStorage (last 5)
```

---

## 12. Toast Notifications (Sonner)

```tsx
// Configure Sonner in root layout
import { Toaster } from 'sonner'
<Toaster
  position="bottom-right"
  toastOptions={{
    className: 'bg-white/10 backdrop-blur-xl border border-white/15 text-white',
    duration: 5000,
  }}
/>

// Standard success
toast.success('Attendance marked as Present')

// With undo action (REQUIRED for destructive actions)
toast('Marked absent', {
  action: {
    label: 'Undo',
    onClick: () => undoAttendance(occurrenceId)
  },
  duration: 5000,
})

// Error
toast.error('Failed to save. Check your connection.')
```

---

## 13. FullCalendar Theming

```tsx
// Override FullCalendar CSS variables to match Classey theme
// In globals.css:
.fc {
  --fc-border-color: rgba(var(--foreground), 0.08);
  --fc-today-bg-color: rgba(var(--accent), 0.08);
  --fc-event-bg-color: rgba(var(--accent), 0.7);
  --fc-event-border-color: rgba(var(--accent), 1);
  --fc-event-text-color: white;
  --fc-button-bg-color: rgba(var(--accent), 0.2);
  --fc-button-active-bg-color: rgba(var(--accent), 0.4);
  --fc-page-bg-color: transparent;
  --fc-neutral-bg-color: rgba(var(--foreground), 0.03);
}

// Current time indicator: white line (override .fc-timegrid-now-indicator-line)
.fc-timegrid-now-indicator-line {
  border-color: white;
  border-width: 2px;
}

// Calendar text overflow — truncate with tooltip on hover
// Event blocks: height based on duration
// Overlapping events: side-by-side rendering (FullCalendar handles this)
```

---

## 14. Responsive Layout Rules

### Dashboard (Home) Layout
```
Desktop (≥1280px): Fixed sidebar 1/3 + scrollable main 2/3
  Sidebar: today's classes, attendance auto-suggest, quick stats
  Main: full week calendar, upcoming exams/tasks

Tablet (768-1279px): Collapsible sidebar, stacked layout

Mobile (<768px): Single column, tabs for switching sections
```

### All pages must handle these states
1. Loading: skeleton cards (not spinner for full page)
2. Empty: illustration + helpful text + primary action button
3. Error: friendly message + retry button
4. Data: the actual content

### Touch targets (mobile)
- Minimum 44×44px for ALL interactive elements
- Increase padding on mobile variant
- No hover-only interactions — always have tap equivalent

### Modal on mobile
- Use Vaul (bottom sheet) instead of centered modal
- Full-width
- Max height 90vh with internal scroll
- Handle-bar at top for drag-to-dismiss