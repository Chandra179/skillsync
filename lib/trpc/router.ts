import { router, publicProcedure } from './server'
import { z } from 'zod'
import { validateSkillConsistency, getSkillWarnings } from '../skill-dependencies'

// Define Zod schemas for skill validation
const skillSchema: z.ZodType<any> = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.enum(['Want to Learn', 'Learning', 'Proficient', 'Mastered']),
  subSkills: z.array(z.lazy(() => skillSchema)),
  parentId: z.string().optional(),
  checklist: z.array(z.object({
    id: z.string(),
    text: z.string(),
    completed: z.boolean()
  })).optional(),
  teachingEvaluations: z.array(z.object({
    id: z.string(),
    topic: z.string(),
    userExplanation: z.string(),
    score: z.object({
      clarity: z.number(),
      coverage: z.number(),
      depth: z.number(),
      misconceptions: z.number(),
      totalScore: z.number()
    }),
    feedback: z.string(),
    timestamp: z.date()
  })).optional()
})

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { message: `Hello ${input.name}!` }
    }),
  
  validateSkillConsistency: publicProcedure
    .input(z.object({ skills: z.array(skillSchema) }))
    .query(({ input }) => {
      const warnings = validateSkillConsistency(input.skills)
      return { warnings }
    }),
  
  getSkillWarnings: publicProcedure
    .input(z.object({ 
      skills: z.array(skillSchema),
      skillId: z.string()
    }))
    .query(({ input }) => {
      const warnings = getSkillWarnings(input.skills, input.skillId)
      return { warnings }
    }),
})

export type AppRouter = typeof appRouter