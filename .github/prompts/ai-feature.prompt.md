---
mode: 'agent'
tools: ['codebase', 'editFiles', 'problems']
description: 'Build an AI feature for Classey using Groq (primary) + Google AI (fallback), with daily limit enforcement, context injection, and proper error handling'
---

# Build Classey AI Feature

Before writing any code:
1. Read #file:.github/skills/classey-features/SKILL.md — section 7 (AI/LLM System)
   for the exact callAI pattern, limit check, fallback logic, and system prompt template
2. Read #file:.github/skills/classey-database/SKILL.md — collection 23 (ai_conversations)
   for message storage and pruning rules
3. Read #file:.github/copilot-instructions.md — AI feature rules and env vars

## AI Feature to build
**Feature:** ${input:featureName}
**Type:** ${input:featureType}
(chat reply / natural language creation / study recommendation /
 goal check / conflict detection / weekly summary / semester insights)

## Architecture — ALL AI calls go through the API route

### API Route
File: `src/app/api/ai/route.ts` (or feature-specific: `src/app/api/ai/${input:featureName}/route.ts`)

```typescript
// NEVER call Groq or Google AI directly from client components
// ALL AI calls: client component → POST /api/ai → Groq/Google AI

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Verify auth cookie (middleware handles this but double-check)
  // 2. Parse request body: { message, context? }
  // 3. Check daily limit FIRST — return 429 if exceeded
  // 4. Build system prompt with user's current data context
  // 5. Call Groq first, fallback to Google on ANY error
  // 6. Increment daily counter
  // 7. Save to ai_conversations (prune if > 20)
  // 8. Return response
}
```

### Daily Limit Check (MANDATORY — check FIRST before any AI call)
```typescript
// Read from settings collection
const settings = await getSettings()
const today = new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })

if (settings.ai_requests_reset_date !== today) {
  // New day — reset counter
  await updateSettings({ ai_requests_today: 0, ai_requests_reset_date: today })
} else if (settings.ai_requests_today >= 50) {
  return NextResponse.json(
    { error: 'Daily AI limit reached (50/50). Resets at midnight IST.' },
    { status: 429 }
  )
}
```

### Groq → Google Fallback Pattern
```typescript
import { createGroq } from '@ai-sdk/groq'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText, streamText } from 'ai'

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY })
const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY })

let result: string
let provider: 'groq' | 'google' = 'groq'

try {
  const response = await generateText({
    model: groq('llama-3.1-8b-instant'),
    system: systemPrompt,
    prompt: userMessage,
    maxTokens: 1000,
  })
  result = response.text
} catch {
  // ANY Groq error → Google fallback (no error surfaced to user)
  provider = 'google'
  const response = await generateText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    prompt: userMessage,
    maxTokens: 1000,
  })
  result = response.text
}
```

### System Prompt — ALWAYS include this context
```typescript
function buildSystemPrompt(context: AIContext): string {
  return `You are Classey's AI assistant for a university student.

Current date and time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
Current semester: ${context.semester?.name ?? 'No active semester'} (ends ${context.semester?.end_date ?? 'N/A'})

Subjects and attendance:
${context.subjects?.map(s =>
  `- ${s.name}: ${s.attendance_percent}% attendance (required: ${s.attendance_requirement_percent ?? 75}%)`
).join('\n') ?? 'No subjects'}

Upcoming exams (next 7 days):
${context.upcomingExams?.map(e =>
  `- ${e.name} (${e.subject_name}): ${e.date} at ${e.start_time ?? 'TBD'}`
).join('\n') ?? 'No upcoming exams'}

Pending tasks: ${context.pendingTaskCount ?? 0} (${context.overdueTaskCount ?? 0} overdue)

AI requests remaining today: ${50 - (context.aiRequestsToday ?? 0)}/50

Be concise, practical, and specific to this student's actual data.
Do not make up information not provided above.
Use clear formatting when presenting multiple items.`
}
```

### Context gathering (fetch before building system prompt)
```typescript
// Gather all context needed for the specific feature:
// - For chat: full context above
// - For study recommendations: subjects with low attendance + upcoming exams
// - For goal check: semester goals + current SPI
// - For conflict detection: events in next 7 days (can be client-side)
// - For weekly summary: this week's occurrences, tasks, exams
```

### Save to ai_conversations + Prune
```typescript
async function saveAndPruneMessages(
  role: 'user' | 'assistant',
  content: string,
  provider?: 'groq' | 'google'
) {
  // Count existing messages
  const existing = await databases.listDocuments(DB_ID, COLLECTIONS.AI_CONVERSATIONS,
    [Query.orderDesc('$createdAt'), Query.limit(1)])

  if (existing.total >= 20) {
    // Get oldest message and delete it
    const oldest = await databases.listDocuments(DB_ID, COLLECTIONS.AI_CONVERSATIONS,
      [Query.orderAsc('timestamp'), Query.limit(1)])
    if (oldest.documents[0]) {
      await databases.deleteDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS,
        oldest.documents[0].$id)
    }
  }

  // Save new message
  await databases.createDocument(DB_ID, COLLECTIONS.AI_CONVERSATIONS, ID.unique(), {
    role, content,
    timestamp: new Date().toISOString(),
    provider: provider ?? null,
    tokens_used: null,
  })
}
```

### Client component — AI Chat UI
```typescript
// Floating chat bubble → slide-up panel
// Show: conversation history (last 20 messages)
// Show: "AI: X/50 requests today" counter
// Show: provider badge on responses ('groq' or 'google')
// Input: text field + send button
// Loading: typing indicator (three dots animation) while waiting
// Error: show toast if 429 (limit reached) or network error
// Natural language creation: if AI returns action JSON, open appropriate modal pre-filled
```

### After creating
- Check #problems for TypeScript errors
- Verify daily limit check runs BEFORE any API call
- Confirm Groq model string is correct (check Groq docs for current free models)
- Confirm Google model string is correct (gemini-1.5-flash or current free tier)
- Verify ai_conversations pruning keeps max 20 messages
- Confirm system prompt includes IST timezone for current date