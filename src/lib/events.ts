import type { PrismaClient } from '@prisma/client'
import type Redis from 'ioredis'

import type { CreateEvent } from '@/schemas/event'
import { EventService } from '@/services/event'

import { prisma } from './prisma'
import { redis } from './redis'

type EventsMap = Map<string, EventService>

interface CreateEventData extends CreateEvent {
  adminId: string
}

function loadOpenEvents(prisma: PrismaClient) {
  const map: EventsMap = new Map()

  prisma.event
    .findMany({ where: { OR: [{ status: 'OPEN' }] } })
    .then(openEvents => {
      openEvents.forEach(({ id, userId }) => {
        const event = new EventService({
          redis,
          eventData: { id, adminId: userId }
        })
        map.set(id, event)
      })
    })

  return map
}

export async function createNewEvent(
  data: CreateEventData,
  eventsMap: EventsMap,
  prisma: PrismaClient,
  redis: Redis
) {
  const { name, latitude, longitude, type, adminId } = data

  const { id } = await prisma.event.create({
    data: { name, latitude, longitude, type, userId: adminId }
  })

  const event = new EventService({ eventData: { id, adminId }, redis })

  eventsMap.set(id, event)

  return id
}

export const events = loadOpenEvents(prisma)
