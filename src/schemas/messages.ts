import { z } from 'zod'

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-90).max(90),
  horizontalAccuracy: z.number(),
  altitude: z.number(),
  verticalAccuracy: z.number()
})

export type Location = z.infer<typeof locationSchema>

export const messageSchemas = {
  AUTH: z.object({
    type: z.literal('AUTHENTICATION'),
    token: z.string()
  }),

  JOIN: z.object({
    type: z.literal('JOIN'),
    deviceId: z.string(),
    location: locationSchema
  }),

  USER_JOINED: z.object({
    type: z.literal('NEW_SUB'),
    deviceId: z.string()
  }),

  DISTANCE: z.object({
    type: z.literal('DISTANCE'),
    from: z.string(),
    to: z.string(),
    distance: z.number()
  }),

  USER_LEFT: z.object({
    type: z.literal('USER_LEFT'),
    devideId: z.string()
  })
} as const

export const messageSchema = z.discriminatedUnion('type', [
  messageSchemas.AUTH,
  messageSchemas.JOIN,
  messageSchemas.USER_JOINED,
  messageSchemas.DISTANCE,
  messageSchemas.USER_LEFT
])

export type Message = z.infer<typeof messageSchema>

// Type Dictionary
export type MessageTypes = {
  [K in keyof typeof messageSchemas]: z.infer<(typeof messageSchemas)[K]>
}

export type SendMessage = (message: Message) => void

export type Subscriber = {
  deviceId: string
  location: Location
  sendMessage: SendMessage
}

export type Admin = {
  userId: string
  sendMessage: SendMessage | undefined
}

export function safeParseJsonMessage<T>(
  jsonString: string,
  schema: z.Schema<T>
):
  | { success: true; data: T }
  | { success: false; error: z.ZodFormattedError<T> | { message: string } } {
  let parsedData: unknown

  try {
    parsedData = JSON.parse(jsonString)
  } catch {
    return { success: false, error: { message: 'Invalid JSON' } }
  }

  const result = schema.safeParse(parsedData)

  if (!result.success) {
    return { success: false, error: result.error.format() }
  }

  return { success: true, data: result.data }
}
