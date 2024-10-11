import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number(),
  JWT_SECRET: z.string(),
  GITHUB_OAUTH_CLIENT_ID: z.string(),
  GITHUB_OAUTH_CLIENT_SECRET: z.string(),
  GITHUB_OAUTH_CLIENT_REDIRECT_URI: z.string()
})

export const env = envSchema.parse(process.env)
