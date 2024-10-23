import type { PrismaClient } from '@prisma/client'

import { EventService } from '@/services/event'

import { prisma } from './prisma'

function getOpenEvents(prisma: PrismaClient) {
  const map = new Map<string, EventService>()

  prisma.event.findMany({ where: { status: 'OPEN' } }).then(openEvents => {
    openEvents.forEach(({ id, userId, status }) => {
      map.set(id, new EventService({ status, adminId: userId }))
    })
  })

  return map
}

export const events = getOpenEvents(prisma)
