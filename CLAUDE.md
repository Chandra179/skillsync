# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server (with Turbopack)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Project Architecture

SkillSync is a Next.js 15 (App Router) application for skill tracking and assessment. The project follows a phased development approach, currently implementing Phase 1 and Phase 2 features.

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Components**: ShadCN UI (built on Radix UI primitives)
- **State Management**: Zustand for client-side state
- **API Layer**: tRPC v11 for type-safe API calls with React Query
- **Backend**: Supabase (auth, PostgreSQL, storage)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Validation**: Zod schemas
- **LLM Integration**: OpenAI SDK (for Phase 2+ features)

### Core Data Structures

**Skill Object Structure** (`lib/store.ts:26-34`):
```typescript
interface Skill {
  id: string
  name: string
  proficiency: ProficiencyLevel  // 'Want to Learn' | 'Learning' | 'Proficient' | 'Mastered'
  subSkills: Skill[]             // Recursive tree structure
  parentId?: string              // Reference to parent skill
  checklist?: ChecklistItem[]    // Self-assessment items
  teachingEvaluations?: TeachingEvaluation[]  // LLM scoring data
}
```

**Proficiency Levels**: Four-tier system from "Want to Learn" through "Mastered"

### Key Architecture Patterns

**State Management Flow**:
- `lib/store.ts` contains the main Zustand store with all skill tree operations
- Recursive helper functions for tree operations: `addSkillToTree`, `updateSkillProficiencyInTree`, `toggleChecklistItemInTree`
- All tree modifications maintain immutability through deep cloning
- Store methods: `addSkill`, `updateSkillProficiency`, `toggleChecklistItem`, `initializeChecklist`

**Component Architecture**:
- `components/skill-card.tsx` - Primary skill display with proficiency dropdown and checklist integration
- `components/skill-checklist.tsx` - Self-assessment checklist with progress tracking
- `components/add-skill-dialog.tsx` - Modal for adding root skills or sub-skills
- `components/user-profile-form.tsx` - User experience and role input form
- `components/teaching-evaluation-dialog.tsx` - LLM-based skill teaching assessment
- `components/providers.tsx` - tRPC and React Query provider wrapper

**Recursive Tree System**:
- Skills can be nested arbitrarily deep with proper parent-child relationships
- All tree operations use recursive patterns to traverse and modify nested structures
- Visual indentation in UI reflects tree hierarchy
- `parentId` field maintains relationships for sub-skills

**Predefined Checklists** (`lib/skill-checklists.ts`):
- Contains predefined self-assessment checklists for common skills (Docker, Golang, React, JavaScript, Kubernetes, Python)
- Auto-initialization when skills with matching names are created
- Each checklist item has `id`, `text`, and `completed` boolean
- Extensible system for adding new skill checklists

**tRPC Integration**:
- `lib/trpc/server.ts` - Server-side tRPC configuration
- `lib/trpc/client.ts` - Client-side tRPC setup with React Query
- `lib/trpc/router.ts` - API route definitions (currently minimal)
- `app/api/trpc/[trpc]/route.ts` - Next.js API route handler
- Type-safe API calls throughout the application

### Phase Implementation Status

**Phase 1** (✅ Completed):
- Add/organize skills in hierarchical tree structure
- Four-tier proficiency marking system
- User profile collection (years of experience, current role)
- Nested sub-skill creation and management

**Phase 2** (🚧 Partially Implemented):
- ✅ Self-assessment checklists for major skills
- ✅ LLM-based teaching evaluation (UI implemented, backend pending)
- ⏳ Skill consistency validation ("You know Kubernetes but not Docker?")
- ⏳ Missing skill discovery and recommendations

**Phase 3-4** (📋 Planned):
- Skill relationship mapping and visualization
- Expert skill tree comparisons
- Mini challenges for skill validation
- Advanced roadmap generation

### Important Implementation Details

**ID Generation**: Uses `Math.random().toString(36).substring(2, 11)` for unique IDs (`lib/store.ts:52-54`)

**Checklist Auto-initialization**: Skills automatically receive predefined checklists based on name matching in `lib/skill-checklists.ts:56-59`

**Teaching Evaluation Schema** (`lib/store.ts:11-24`): Structured scoring system with clarity, coverage, depth, and misconceptions metrics

**Tree Operation Patterns**: All skill modifications follow immutable update patterns with recursive traversal

### File Structure Conventions
- `app/` - Next.js app router pages and API routes
- `components/` - React components (UI components in `ui/` subdirectory)
- `lib/` - Utility functions, stores, and service integrations
- `lib/supabase/` - Database client configurations
- `lib/trpc/` - API layer setup and routing
- `public/` - Static assets and icons

### Development Notes
- Uses Turbopack for faster development builds
- All components follow TypeScript strict mode
- ShadCN UI components provide consistent design system
- Zustand store handles all client-side state management
- tRPC ensures type safety between frontend and backend