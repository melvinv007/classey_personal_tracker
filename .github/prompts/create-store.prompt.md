---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Create a Zustand store for Classey client-side state with correct patterns, TypeScript types, and persistence where needed'
---

# Create Classey Zustand Store

Before writing any code:
1. Read #file:.github/copilot-instructions.md — state management rules
   (Zustand = client UI state ONLY, never server/Appwrite data)
2. Check #codebase — look at existing stores in src/stores/ for patterns

## Store to build
**Store name:** ${input:storeName}
**Purpose:** ${input:storePurpose}
**Needs persistence?** ${input:needsPersistence} (yes = localStorage, no = memory only)

## Rules — read before writing

### What belongs in Zustand (client state only)
✅ Theme mode (dark/light)
✅ Accent color (current semester's hex color)
✅ Which modal is open (boolean flags)
✅ Currently active semester ID
✅ UI preferences (sidebar collapsed, etc.)
✅ Temporary form state spanning multiple steps
✅ AI chat panel open/closed

### What does NOT belong in Zustand
❌ Semester data (use TanStack Query)
❌ Subject data (use TanStack Query)
❌ Any Appwrite collection data (use TanStack Query)
❌ Server state of any kind

### Store pattern (Zustand v5)
```typescript
// src/stores/${input:storeName}-store.ts

import { create } from 'zustand'
import { persist } from 'zustand/middleware'  // only if persistence needed

interface ${input:storeName}State {
  // State fields — explicitly typed, no 'any'
}

interface ${input:storeName}Actions {
  // All action names start with a verb: set, toggle, open, close, reset, clear
  // Actions return void
}

type ${input:storeName}Store = ${input:storeName}State & ${input:storeName}Actions

// WITHOUT persistence:
export const use${input:storeName}Store = create<${input:storeName}Store>()((set, get) => ({
  // initial state
  // actions
}))

// WITH persistence (localStorage):
export const use${input:storeName}Store = create<${input:storeName}Store>()(
  persist(
    (set, get) => ({
      // initial state
      // actions
    }),
    {
      name: 'classey-${input:storeName}',  // localStorage key
      // Only persist specific fields (not all state):
      partialize: (state) => ({
        // only the fields that should survive page refresh
      }),
    }
  )
)
```

### ThemeStore pattern (reference — already exists)
```typescript
// The theme store sets CSS variables on the DOM — follow this pattern
// for anything that needs to affect global CSS

setAccentColor: (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  document.documentElement.style.setProperty('--accent', `${r} ${g} ${b}`)
  document.documentElement.style.setProperty('--accent-hex', hex)
  set({ accentColor: hex })
}
```

### Action naming conventions
```
set${Field}     → replace a value
toggle${Field}  → boolean flip
open${Modal}    → set modal flag to true
close${Modal}   → set modal flag to false
reset           → return to initial state
clear${Field}   → set to null/empty
```

### Usage in components
```tsx
// Access state and actions separately for performance
const accentColor = useThemeStore(state => state.accentColor)
const setAccentColor = useThemeStore(state => state.setAccentColor)

// Never destructure the whole store — causes unnecessary re-renders
// ❌ const { accentColor, setAccentColor } = useThemeStore()
// ✅ const accentColor = useThemeStore(state => state.accentColor)
```

### After creating
- Check #problems for TypeScript errors
- Verify no Appwrite/server data is stored in this Zustand store
- If persisted: confirm partialize only includes fields that need persistence
- Export store hook with correct name: use${input:storeName}Store