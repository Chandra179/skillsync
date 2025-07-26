import { router, publicProcedure } from './server'
import { z } from 'zod'
import { validateSkillConsistency, getSkillWarnings } from '../skill-dependencies'

// Define Zod schemas for skill validation
const skillSchema = z.object({
  id: z.string(),
  name: z.string(),
  proficiency: z.enum(['Want to Learn', 'Learning', 'Proficient', 'Mastered']),
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
    .input(z.object({ 
      skills: z.array(skillSchema),
      userContext: z.object({
        yearsOfExperience: z.number().optional(),
        currentRole: z.string().optional(),
        existingSkills: z.array(z.string()).optional(),
        industry: z.string().optional()
      }).optional()
    }))
    .query(async ({ input }) => {
      const warnings = await validateSkillConsistency(input.skills, input.userContext)
      return { warnings }
    }),
  
  getSkillWarnings: publicProcedure
    .input(z.object({ 
      skills: z.array(skillSchema),
      skillId: z.string(),
      userContext: z.object({
        yearsOfExperience: z.number().optional(),
        currentRole: z.string().optional(),
        existingSkills: z.array(z.string()).optional(),
        industry: z.string().optional()
      }).optional()
    }))
    .query(async ({ input }) => {
      const warnings = await getSkillWarnings(input.skills, input.skillId, input.userContext)
      return { warnings }
    }),
})

export type AppRouter = typeof appRouter