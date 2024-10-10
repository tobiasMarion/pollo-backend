import { z } from 'zod'

const envSchema = z.object({
  PORT: z.number()
})

export const env = envSchema.parse(process.env)
