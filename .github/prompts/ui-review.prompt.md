---
mode: 'agent'
tools: ['codebase', 'problems']
description: 'Review any Classey component or page for UI/UX quality — checks glassmorphism values, responsiveness, animations, theming, accessibility, and Classey design standards'
---

# Classey UI/UX Review

Before reviewing:
1. Read #file:.github/skills/classey-ui/SKILL.md — exact values to check against
2. Read #file:.github/copilot-instructions.md — UI rules and breakpoints

## Component/Page to review
${input:componentPath}

## Run through this complete checklist and report PASS / FAIL / FIX for each item

---

### 🎨 GLASSMORPHISM
- [ ] Cards use: bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
- [ ] Modals use: bg-white/8 backdrop-blur-2xl border border-white/12 rounded-3xl
- [ ] No hardcoded rgba() colors — all use CSS variables or Tailwind opacity modifiers
- [ ] Light mode has equivalent styles (bg-black/3 border-black/8)

### 🌈 ACCENT COLOR SYSTEM
- [ ] No hardcoded hex colors for themed elements
- [ ] Accent uses rgb(var(--accent)) or rgba(var(--accent), X)
- [ ] Glow borders on semester/subject cards use rgba(var(--accent), 0.3)
- [ ] Charts use rgb(var(--accent)) as primary color
- [ ] Primary buttons use accent color (not hardcoded purple/blue)

### 🎬 ANIMATIONS (Framer Motion)
- [ ] Cards have entrance animation (opacity 0→1, y 20→0, scale 0.97→1)
- [ ] List of cards uses staggerChildren (50ms delay)
- [ ] Modals use spring animation (stiffness 400, damping 35)
- [ ] Hover states use whileHover (scale 1.02, 150ms)
- [ ] Tap states use whileTap (scale 0.97)
- [ ] AnimatePresence wraps conditionally rendered elements
- [ ] No CSS transitions used instead of Framer Motion for interactive elements

### 📱 RESPONSIVENESS — test ALL breakpoints
- [ ] 375px (iPhone SE): single column, no overflow, readable text
- [ ] 430px (iPhone Pro Max): same as above, touch targets ≥44px
- [ ] 768px (Tablet): layout shifts correctly
- [ ] 1024px (Tablet+): multi-column where specified
- [ ] 1280px (Desktop): 1/3 sidebar + 2/3 main on home page
- [ ] 1440px (Wide): max-width container, no stretch
- [ ] No horizontal scrollbar at any breakpoint
- [ ] All text readable (no overflow, no truncation without tooltip)

### 📐 TOUCH TARGETS (Mobile)
- [ ] All buttons minimum 44×44px on mobile
- [ ] Links and interactive areas have enough padding
- [ ] No hover-only interactions (all have tap equivalent)
- [ ] Long press (500ms) implemented for card context menus on mobile
- [ ] Swipe-to-complete on task cards works on touch devices

### 🪟 MODALS
- [ ] Desktop: centered, max-w-lg, spring entrance animation
- [ ] Mobile: Vaul bottom sheet (not centered modal)
- [ ] Mobile max-height: 90vh with internal scroll
- [ ] Mobile has drag handle bar at top
- [ ] Escape key closes modal
- [ ] Click outside overlay closes modal
- [ ] Modal themed: matches dark/light mode + accent color
- [ ] Form errors show below each field (red border + red text)
- [ ] Submit button disabled + spinner while loading

### 🔔 TOASTS
- [ ] Success toasts use toast.success()
- [ ] Error toasts use toast.error()
- [ ] Destructive actions have [Undo] button with 5-second window
- [ ] Toasts are iOS-style (Sonner configured in layout)

### 🌙 DARK / LIGHT MODE
- [ ] Component looks correct in dark mode (default)
- [ ] Component looks correct in light mode
- [ ] No pure white or pure black hardcoded — uses Tailwind dark: variants
- [ ] Text contrast is readable in both modes

### ♿ ACCESSIBILITY
- [ ] Interactive elements have aria-label where icon-only
- [ ] Images have alt text
- [ ] Form inputs have associated labels
- [ ] Focus states visible (focus-visible:ring)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color is not the only indicator (uses icons/text too)

### 🖋️ TYPOGRAPHY
- [ ] Font family is Nunito (or user's selected font)
- [ ] Text hierarchy clear: heading → subheading → body
- [ ] No text too small (<12px)
- [ ] Long text truncates with ellipsis (not overflow)
- [ ] Numbers in stats use tabular-nums for alignment

### ⚡ PERFORMANCE
- [ ] No heavy operations in render (moved to useMemo/useCallback)
- [ ] Images use next/image
- [ ] No inline function definitions in JSX for frequently-called handlers
- [ ] TanStack Query used for all data (never fetch in useEffect)
- [ ] Zustand selectors are granular (not full store destructure)

### 🚫 ANTI-PATTERNS CHECK
- [ ] NOT using default shadcn styling (always customized)
- [ ] NOT AI-looking / generic flat UI
- [ ] NOT hardcoded colors (hex or rgb) for any themed element
- [ ] NOT using 'any' TypeScript type
- [ ] NOT fetching data in useEffect
- [ ] NOT storing server data in Zustand

---

## Report format

For each FAIL or FIX item:
1. State what's wrong (exact line/element if possible)
2. State the correct value/approach (from classey-ui skill)
3. Provide the fix as a code snippet

After reporting: ask "Should I apply all fixes now?"