import { z } from 'zod'

import { type Location, locationSchema } from './location'

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

  LOCATION_UPDATE: z.object({
    type: z.literal('LOCATION_UPDATE'),
    location: locationSchema
  }),

  USER_JOINED: z.object({
    type: z.literal('USER_JOINED'),
    deviceId: z.string(),
    location: locationSchema
  }),

  DISTANCE: z.object({
    type: z.literal('DISTANCE'),
    to: z.string(),
    distance: z.number().nullable()
  }),

  USER_LEFT: z.object({
    type: z.literal('USER_LEFT'),
    deviceId: z.string()
  }),

  SET_POINT: z.object({
    type: z.literal('SET_POINT'),
    absolute: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    relative: z
      .object({
        x: z.number().int().nonnegative(),
        y: z.number().int().nonnegative(),
        z: z.number().int().nonnegative()
      })
      .nullable()
  })
} as const

export const messageSchema = z.discriminatedUnion('type', [
  messageSchemas.AUTH,
  messageSchemas.JOIN,
  messageSchemas.LOCATION_UPDATE,
  messageSchemas.USER_JOINED,
  messageSchemas.DISTANCE,
  messageSchemas.USER_LEFT,
  messageSchemas.SET_POINT
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
