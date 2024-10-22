import type { EventStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

import { getSetFromObjectAttributes, truncateDecimalPlaces } from '@/utils'

interface EventServiceContructor {
  status?: EventStatus
  adminId: string
}

export class EventService {
  private admin: Admin
  private status: EventStatus
  private subscribers = new Map<string, Subscriber>()
  private subscribersMatrix: Subscriber[][][] = []
  private decimalPlacesPrecision = 5

  constructor({ status = 'OPEN', adminId }: EventServiceContructor) {
    this.status = status
    this.admin = {
      userId: adminId,
      sendMessage: undefined
    }
  }

  public setAdminConnection(sendMessage: SendMessage) {
    this.admin.sendMessage = sendMessage
  }

  public subscribe(subscriber: Subscriber): string {
    const subscriberId = randomUUID()
    this.subscribers.set(subscriberId, {
      ...subscriber,
      latitude: truncateDecimalPlaces(
        subscriber.latitude,
        this.decimalPlacesPrecision
      ),
      longitude: truncateDecimalPlaces(
        subscriber.longitude,
        this.decimalPlacesPrecision
      )
    })

    this.notifyAdmin({
      type: 'USER_JOINED',
      id: subscriberId,
      accuracy: subscriber.accuracy,
      latitude: subscriber.latitude,
      longitude: subscriber.longitude
    })

    return subscriberId
  }

  public notifyAdmin(message: Message) {
    if (this.admin.sendMessage) {
      this.admin.sendMessage(JSON.stringify(message))
    }
  }

  public publish(message: Message) {
    for (const subscriber of Object.values(this.subscribers)) {
      subscriber.sendMessage(JSON.stringify(message))
    }
  }

  // Notes:
  //  1. There's probably a better way to do this
  //  2. I guess this method will block the loop in very large event.
  //     If it is true, I think it can be done asynchronously
  public mapSubscribers() {
    const sortedUniqueLatitudes = [
      ...getSetFromObjectAttributes(this.subscribers, 'latitude')
    ].sort()

    const sortedUniqueLongitudes = [
      ...getSetFromObjectAttributes(this.subscribers, 'longitude')
    ].sort()

    // Use this set to find the place where we're gonna insert subscriber into
    // this.subscribersMatrix in O(1)
    const latitudeIndexMap = new Map<number, number>()
    const longitudeIndexMap = new Map<number, number>()

    sortedUniqueLatitudes.forEach((value, index) =>
      latitudeIndexMap.set(value, index)
    )

    sortedUniqueLongitudes.forEach((value, index) =>
      longitudeIndexMap.set(value, index)
    )

    for (const subscriber of Object.values(this.subscribers)) {
      const i = latitudeIndexMap.get(subscriber.latitude)
      const j = longitudeIndexMap.get(subscriber.longitude)

      if (i !== undefined && j !== undefined) {
        this.subscribersMatrix[i][j].push(subscriber)
      }
    }
  }
}
