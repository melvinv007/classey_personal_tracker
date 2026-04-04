---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Create a TanStack Query hook for a Classey Appwrite collection with correct query keys, optimistic updates, soft-delete filtering, and TypeScript types'
---

# Create Classey TanStack Query Hook

Before writing any code:
1. Read #file:.github/skills/classey-database/SKILL.md — get the exact collection
   name, field names, query patterns, and optimistic update pattern
2. Read #file:.github/copilot-instructions.md — coding standards
3. Check #codebase — look at existing hooks in src/hooks/ to follow same pattern

## Hook to build
**Collection:** ${input:collectionName}
**Hook file:** `src/hooks/use-${input:collectionName}.ts`

## Generate all of the following

### Query Keys (centralized, typed)
```typescript
export const ${input:collectionName}Keys = {
  all: ['${input:collectionName}'] as const,
  lists: () => [...${input:collectionName}Keys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...${input:collectionName}Keys.lists(), { filters }] as const,
  detail: (id: string) =>
    [...${input:collectionName}Keys.all, 'detail', id] as const,
}
```

### useQuery hooks
```typescript
// List hook — with filters support
export function use${input:collectionName}s(filters?: {
  // typed filter options specific to this collection
}) {
  return useQuery({
    queryKey: ${input:collectionName}Keys.list(filters),
    queryFn: async () => {
      const queries = [
        Query.isNull('deleted_at'),  // ALWAYS — soft delete filter
        // Add collection-specific default queries from classey-database skill
      ]
      const response = await databases.listDocuments(DB_ID,
        COLLECTIONS.${input:collectionName.toUpperCase()}, queries)
      return response.documents as ${input:collectionName}[]
    },
    staleTime: 1000 * 60 * 2,  // 2 minutes
  })
}

// Single document hook
export function use${input:collectionName}(id: string) {
  return useQuery({
    queryKey: ${input:collectionName}Keys.detail(id),
    queryFn: async () => {
      const doc = await databases.getDocument(DB_ID,
        COLLECTIONS.${input:collectionName.toUpperCase()}, id)
      return doc as ${input:collectionName}
    },
    enabled: !!id,  // only run if id exists
  })
}
```

### useMutation hooks (with optimistic updates)

#### Create
```typescript
export function useCreate${input:collectionName}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: Create${input:collectionName}Input) => {
      return databases.createDocument(
        DB_ID, COLLECTIONS.${input:collectionName.toUpperCase()},
        ID.unique(), {
          ...data,
          deleted_at: null,  // explicitly set for soft delete compatibility
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ${input:collectionName}Keys.lists()
      })
    },
  })
}
```

#### Update (with optimistic update)
```typescript
export function useUpdate${input:collectionName}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: {
      id: string
      data: Partial<Create${input:collectionName}Input>
    }) => {
      return databases.updateDocument(
        DB_ID, COLLECTIONS.${input:collectionName.toUpperCase()}, id, data
      )
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: ${input:collectionName}Keys.detail(id)
      })
      const previous = queryClient.getQueryData(
        ${input:collectionName}Keys.detail(id)
      )
      queryClient.setQueryData(
        ${input:collectionName}Keys.detail(id),
        (old: ${input:collectionName}) => old ? { ...old, ...data } : old
      )
      return { previous }
    },
    onError: (_, { id }, context) => {
      queryClient.setQueryData(
        ${input:collectionName}Keys.detail(id), context?.previous
      )
    },
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ${input:collectionName}Keys.detail(id)
      })
      queryClient.invalidateQueries({
        queryKey: ${input:collectionName}Keys.lists()
      })
    },
  })
}
```

#### Soft Delete (with optimistic update — supports undo)
```typescript
export function useDelete${input:collectionName}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Soft delete — set deleted_at, never hard delete
      return databases.updateDocument(
        DB_ID, COLLECTIONS.${input:collectionName.toUpperCase()}, id, {
          deleted_at: new Date().toISOString()
        }
      )
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: ${input:collectionName}Keys.lists()
      })
      const previous = queryClient.getQueryData(
        ${input:collectionName}Keys.lists()
      )
      // Optimistic remove from list
      queryClient.setQueryData(
        ${input:collectionName}Keys.lists(),
        (old: ${input:collectionName}[]) => old?.filter(item => item.$id !== id)
      )
      return { previous }
    },
    onError: (_, __, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ${input:collectionName}Keys.lists(), context?.previous
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ${input:collectionName}Keys.lists()
      })
    },
  })
}
```

### Undo helper (call when user clicks Undo in toast)
```typescript
export function useRestoreDeleted${input:collectionName}() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      // Undo soft delete — clear deleted_at
      return databases.updateDocument(
        DB_ID, COLLECTIONS.${input:collectionName.toUpperCase()}, id, {
          deleted_at: null
        }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ${input:collectionName}Keys.lists()
      })
    },
  })
}
```

### Input types
Define Create and Update input types based on classey-database skill schema:
```typescript
// Omit Appwrite auto-generated fields from input types
type Create${input:collectionName}Input = Omit<
  ${input:collectionName},
  '$id' | '$createdAt' | '$updatedAt' | '$collectionId' | '$databaseId' | '$permissions'
>
```

### After creating
- Check #problems for TypeScript errors
- Verify COLLECTIONS key name matches src/lib/appwrite.ts exactly
- Confirm Query.isNull('deleted_at') is in ALL list queries
- Confirm optimistic updates follow the exact pattern above
- Verify all type names match src/types/database.ts interfaces