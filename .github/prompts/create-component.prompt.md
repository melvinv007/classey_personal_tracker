---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Create a new Classey UI component with glassmorphism, animations, correct theming, and full responsiveness'
---

# Create Classey Component

Before writing any code:
1. Read #file:.github/skills/classey-ui/SKILL.md — get exact glassmorphism values,
   animation specs, color system, and component patterns
2. Read #file:.github/copilot-instructions.md — get coding standards
3. Check #codebase for similar existing components to follow the same pattern

## Component to build
**Name:** ${input:componentName}
**Purpose:** ${input:componentPurpose}
**Location:** ${input:filePath}

## Requirements — follow ALL of these

### File structure
```tsx
// src/components/{category}/${input:componentName}.tsx

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
// ... other imports

// Props interface — always named ComponentNameProps
export interface ${input:componentName}Props {
  // All props explicitly typed — no 'any'
  // Include className?: string for composability
}

// Export as named export — never default export
export function ${input:componentName}({ ...props }: ${input:componentName}Props) {
  // Implementation
}
```

### Styling rules (from classey-ui skill)
- Glassmorphism: bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl
- Accent color: use rgb(var(--accent)) via inline style or arbitrary Tailwind
- Glow border (cards): inline style boxShadow with rgba(var(--accent), 0.3)
- Dark/light: always use dark: prefix variants — test both modes
- Never hardcode colors — always CSS variables or Tailwind with opacity

### Animation rules
- Entrance: Framer Motion — opacity 0→1 + y 20→0 + scale 0.97→1
- Spring: stiffness 300, damping 30
- Hover: whileHover scale 1.02, duration 150ms
- Tap: whileTap scale 0.97
- Wrap in motion.div — never plain div for animated components

### Interaction rules (from plan)
- Mobile: short tap → navigate, long press 500ms → context/expand
- Desktop: single click → navigate, right-click → context menu
- Touch targets: minimum 44×44px on all interactive elements

### Responsiveness
Build for ALL breakpoints in one component:
- 375px: mobile base styles
- 768px: md: prefix changes
- 1024px: lg: prefix changes  
- 1280px: xl: prefix changes

### TypeScript
- All props explicitly typed with interface
- All event handlers typed (e.g. onClick: (id: string) => void)
- Return type on the function
- No 'any' anywhere

### After creating
- Check #problems for TypeScript errors
- Verify glassmorphism values match classey-ui skill exactly
- Confirm accent color uses CSS variable (not hardcoded)
- Test that component renders in both light and dark mode