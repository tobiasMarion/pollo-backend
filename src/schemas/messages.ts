import { z } from 'zod'

import { effectSchema } from './effects'
import { positionSchema } from './graph'
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

  LOCATION_UPDATE_REPORT: z.object({
    type: z.literal('LOCATION_UPDATE_REPORT'),
    deviceId: z.string(),
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

  DISTANCE_REPORT: z.object({
    type: z.literal('DISTANCE_REPORT'),
    from: z.string(),
    to: z.string(),
    distance: z.number().nullable()
  }),

  USER_LEFT: z.object({
    type: z.literal('USER_LEFT'),
    deviceId: z.string()
  }),

  SET_POINT: z.object({
    type: z.literal('SET_POINT'),
    position: positionSchema
  }),

  SET_POINT_REPORT: z.object({
    type: z.literal('SET_POINT_REPORT'),
    deviceId: z.string(),
    position: positionSchema
  }),

  EFFECT: z.object({
    type: z.literal('EFFECT'),
    effect: effectSchema
  })
} as const

export const messageSchema = z.discriminatedUnion('type', [
  messageSchemas.AUTH,
  messageSchemas.JOIN,
  messageSchemas.LOCATION_UPDATE,
  messageSchemas.LOCATION_UPDATE_REPORT,
  messageSchemas.USER_JOINED,
  messageSchemas.USER_LEFT,
  messageSchemas.DISTANCE,
  messageSchemas.DISTANCE_REPORT,
  messageSchemas.SET_POINT,
  messageSchemas.SET_POINT_REPORT,
  messageSchemas.EFFECT
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

interface SafeParseError<T> {
  success: false
  error: z.ZodFormattedError<T> | { message: string }
  data: null
}

type SafeParseReturn<T> =
  | { success: true; error: null; data: T }
  | SafeParseError<T>

export function safeParseJsonMessage<T>(
  jsonString: string,
  schema: z.Schema<T>
): SafeParseReturn<T> {
  let parsedData: unknown

  try {
    parsedData = JSON.parse(jsonString)
  } catch {
    return { success: false, error: { message: 'Invalid JSON' }, data: null }
  }

  const result = schema.safeParse(parsedData)

  if (!result.success) {
    return { success: false, error: result.error.format(), data: null }
  }

  return { success: true, data: result.data, error: null }
}
