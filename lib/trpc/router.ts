// ...tRPC router definition...
import { router, publicProcedure } from './server'
import { z } from 'zod'

export const appRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => {
      return { message: `Hello ${input.name}!` }
    }),
})

export type AppRouter = typeof appRouter