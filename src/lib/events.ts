import type { PrismaClient } from '@prisma/client'

import { EventPubSub } from '@/services/events/event-pub-sub'

import { prisma } from './prisma'

type EventsRecord = Record<string, EventPubSub>

function getOpenEvents(prisma: PrismaClient) {
  const record: EventsRecord = {}

  prisma.event.findMany({ where: { status: 'OPEN' } }).then((openEvents) => {
    openEvents.forEach(({ id, userId, status }) => {
      record[id] = new EventPubSub({ status, adminId: userId })
    })
  })

  return record
}

export const events: EventsRecord = getOpenEvents(prisma)
