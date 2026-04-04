---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Create a Classey modal with correct glassmorphism, Vaul on mobile, centered on desktop, themed buttons, smart defaults, and form validation'
---

# Create Classey Modal

Before writing any code:
1. Read #file:.github/skills/classey-ui/SKILL.md — modal entrance animation,
   glassmorphism elevated values, Vaul vs Dialog pattern, button styles
2. Read #file:.github/skills/classey-database/SKILL.md — correct field names,
   Zod schema, and mutation pattern for this entity
3. Read #file:.github/skills/classey-features/SKILL.md — smart defaults and
   business rules for this entity
4. Read #file:.github/skills/classey-screens/SKILL.md — which modal # this is,
   correct file path, and what fields it needs
5. Check #codebase for an existing modal to follow the same pattern

## Modal to build
**Modal:** ${input:modalName}
**Entity:** ${input:entityType} (semester / subject / exam / task / event / etc.)
**Trigger:** ${input:triggerDescription}

## Requirements — follow ALL of these

### File location
```
src/components/modals/${input:modalName}.tsx
```

### Architecture — Desktop vs Mobile
```tsx
export function ${input:modalName}({ isOpen, onClose, ...props }: ${input:modalName}Props) {
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Mobile: Vaul bottom sheet
  if (isMobile) {
    return (
      <Drawer.Root open={isOpen} onOpenChange={onClose}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
          <Drawer.Content className="
            fixed bottom-0 left-0 right-0 z-50
            bg-white/8 backdrop-blur-2xl
            border-t border-white/12
            rounded-t-3xl
            px-6 pb-8 pt-4
            max-h-[90vh] overflow-y-auto
          ">
            <div className="mx-auto w-12 h-1.5 bg-white/20 rounded-full mb-6" />
            {/* Modal content */}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    )
  }

  // Desktop: centered modal with AnimatePresence
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="
              fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
              z-50 w-full max-w-lg
              bg-white/8 backdrop-blur-2xl
              border border-white/12 rounded-3xl
              p-6 max-h-[90vh] overflow-y-auto
            "
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

### Form requirements
- Use React Hook Form + Zod (field names from classey-database skill)
- Smart defaults: pre-fill based on context (from classey-features skill)
- All fields validated before submit
- Show error below each field (red text, red border)
- Submit button: disabled + shows spinner while mutating
- Primary button: uses accent color (bg-[rgba(var(--accent),0.8)])
- Cancel: ghost button to the left of submit

### Close behavior
- Escape key closes (useEffect + keydown listener)
- Click outside overlay closes (onClick on overlay)
- After successful submit: close + show Sonner success toast
- On error: show Sonner error toast, keep modal open

### Keyboard accessibility
- Auto-focus first input on open (autoFocus prop)
- Tab order logical (top to bottom)
- Escape to close
- Enter to submit (if single-field forms)

### Mutation pattern
```tsx
const mutation = useCreate${input:entityType}() // from hooks/use-${input:entityType}s.ts

async function onSubmit(data: FormData) {
  try {
    await mutation.mutateAsync(data)
    onClose()
    toast.success('${input:entityType} created successfully')
  } catch (error) {
    toast.error('Failed to create. Please try again.')
  }
}
```

### After creating
- Check #problems for TypeScript errors  
- Verify Zod schema field names match classey-database skill exactly
- Confirm smart defaults match classey-features skill
- Test modal opens/closes correctly on both mobile and desktop breakpoints
- Verify accent color on submit button works