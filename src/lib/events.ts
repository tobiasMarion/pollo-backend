import type { PrismaClient } from '@prisma/client'

import { EventService } from '@/services/event'

import { prisma } from './prisma'

function getOpenEvents(prisma: PrismaClient) {
  const map = new Map<string, EventService>()

  prisma.event
    .findMany({ where: { OR: [{ status: 'OPEN' }, { status: 'CLOSED' }] } })
    .then(openEvents => {
      openEvents.forEach(({ id, userId, status }) => {
        const event = new EventService({ status, adminId: userId })
        event.open()
        map.set(id, event)
      })
    })

  return map
}

export const events = getOpenEvents(prisma)
