---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Scaffold a new Classey page/screen with correct layout, components, data fetching, animations and responsive behavior'
---

# Create Classey Page

Before writing any code:
1. Read #file:.github/skills/classey-screens/SKILL.md — find the exact screen spec
2. Read #file:.github/skills/classey-ui/SKILL.md — get layout and animation rules
3. Read #file:.github/skills/classey-database/SKILL.md — get the correct query patterns
4. Read #file:.github/copilot-instructions.md — confirm coding standards

## Page to build
${input:pageName} — found at URL: ${input:pageUrl}

## Requirements — follow ALL of these

### File location
Create at the exact path from classey-screens skill.
Use Next.js App Router conventions (page.tsx, layout.tsx).

### Page structure
```tsx
// Every page follows this structure:
'use client' // only if needs client interactivity

import { motion } from 'framer-motion'
// ... other imports

export default function ${input:pageName}Page() {
  // 1. All hooks at top (TanStack Query, Zustand, useState)
  // 2. Derived state and calculations
  // 3. Event handlers
  // 4. Loading state render
  // 5. Error state render  
  // 6. Empty state render
  // 7. Main content render
}
```

### Must include
- [ ] BackButton component (on all inner pages, not home)
- [ ] Page entrance animation (Framer Motion — opacity 0→1, y -10→0, 300ms)
- [ ] Loading skeleton (not spinner for full page — use skeleton cards)
- [ ] Empty state (illustration + helpful text + primary action button)
- [ ] Error state (friendly message + retry button)
- [ ] Fully responsive at ALL breakpoints: 375px, 430px, 768px, 1024px, 1280px, 1440px
- [ ] All data fetched via TanStack Query hooks (never raw fetch in component)
- [ ] TypeScript — no `any`, all props typed

### Layout rules
- Mobile (<768px): single column, bottom nav padding (pb-24)
- Tablet (768-1279px): 2 columns where appropriate
- Desktop (≥1280px): follow exact layout from classey-screens skill

### Animation
- Page entrance: wrap content in motion.div with pageVariants
- Card lists: staggered entrance (50ms delay per card)
- All cards use cardVariants from classey-ui skill

### After creating the page
- Check #problems for TypeScript errors
- Verify the route matches exactly what classey-screens skill specifies
- Confirm all imported components exist (create stubs if not yet built)