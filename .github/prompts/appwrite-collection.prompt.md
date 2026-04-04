---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Set up an Appwrite collection with correct attributes, TypeScript interface, Zod schema, and TanStack Query hooks for a Classey collection'
---

# Set Up Appwrite Collection

Before writing any code:
1. Read #file:.github/skills/classey-database/SKILL.md — get the EXACT field
   definitions, types, relationships, and rules for this collection
2. Read #file:.github/copilot-instructions.md — coding standards and file naming

## Collection to set up
**Collection:** ${input:collectionName}

## What to generate

### 1. TypeScript Interface
File: `src/types/database.ts` — add interface here

Extract the exact interface from classey-database skill.
Every field must match exactly — names, types, nullability.
Extend AppwriteDocument for base Appwrite fields.

### 2. Zod Validation Schema
File: `src/types/database.ts` — add schema alongside interface

Create schema for:
- createSchema (fields required for creation)
- updateSchema (all fields optional for partial updates)

Use field names that EXACTLY match the Appwrite collection attributes.

### 3. TanStack Query Hook File
File: `src/hooks/use-${input:collectionName}.ts`

Include ALL of these exports:
```typescript
// Query keys object
export const ${input:collectionName}Keys = {
  all: ['${input:collectionName}'] as const,
  lists: () => [...${input:collectionName}Keys.all, 'list'] as const,
  list: (filters: object) => [...${input:collectionName}Keys.lists(), filters] as const,
  detail: (id: string) => [...${input:collectionName}Keys.all, 'detail', id] as const,
}

// Fetch all (with common filters from classey-database skill)
export function use${input:collectionName}s(filters?: object)

// Fetch single by ID
export function use${input:collectionName}(id: string)

// Create — with optimistic update
export function useCreate${input:collectionName}()

// Update — with optimistic update
export function useUpdate${input:collectionName}()

// Soft delete — sets deleted_at, with optimistic update + undo support
export function useDelete${input:collectionName}()
```

### 4. Appwrite Query rules (from classey-database skill)
ALWAYS include these in every list query:
```typescript
Query.isNull('deleted_at'),  // MANDATORY — filter soft-deleted
```

Use optimistic updates for mutations:
- onMutate: update cache immediately
- onError: rollback to previous
- onSettled: invalidate and refetch

### 5. Update COLLECTIONS constant
File: `src/lib/appwrite.ts`
Add the collection ID env var key to the COLLECTIONS object.

### 6. Update .env.example
Add the new env var:
```
NEXT_PUBLIC_COL_${input:collectionName.toUpperCase()}=your_collection_id_here
```

### After generating
- Check #problems for TypeScript errors
- Verify all field names match classey-database skill EXACTLY
- Confirm soft-delete filter is in all list queries
- Confirm optimistic updates follow the pattern from classey-database skill