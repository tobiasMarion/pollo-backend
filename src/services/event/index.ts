import type { EventStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

import {
  getIndexOfClosestValue,
  getSortedUniqueAttributes,
  truncateDecimalPlaces
} from '@/utils'

interface EventServiceContructor {
  status?: EventStatus
  adminId: string
}

export class EventService {
  private admin: Admin
  private status: EventStatus
  private subscribers = new Map<string, Subscriber>()
  private subscribersMatrix: SendMessage[][][] = []

  private matrixValues: { latitude: number[]; longitude: number[] } = {
    latitude: [],
    longitude: []
  }

  // This value is a bit tricky
  // It is direclty related to the event's resolution
  // A very small value might generate a very large matrix
  // A very big value will generate an resolution too small
  private decimalPlacesPrecision = 5

  constructor({ status = 'OPEN', adminId }: EventServiceContructor) {
    this.status = status
    this.admin = {
      userId: adminId,
      sendMessage: undefined
    }
  }

  public getAdminId() {
    return this.admin.userId
  }

  public setAdminConnection(sendMessage: SendMessage) {
    this.admin.sendMessage = sendMessage
  }

  public getSubscribers() {
    return Array.from(
      this.subscribers,
      ([id, { latitude, longitude, accuracy }]) => ({
        id,
        latitude,
        longitude,
        accuracy
      })
    )
  }

  public open() {
    this.status = 'OPEN'
    this.subscribersMatrix = []
    this.matrixValues = { latitude: [], longitude: [] }
  }

  public close() {
    if (this.subscribers.size === 0) {
      return
    }

    this.status = 'CLOSED'

    return this.mapSubscribers()
  }

  public subscribe(subscriber: Subscriber): string {
    const subscriberId = randomUUID()

    const sub = {
      ...subscriber,
      latitude: truncateDecimalPlaces(
        subscriber.latitude,
        this.decimalPlacesPrecision
      ),
      longitude: truncateDecimalPlaces(
        subscriber.longitude,
        this.decimalPlacesPrecision
      )
    }

    this.subscribers.set(subscriberId, sub)

    this.notifyAdmin({
      type: 'USER_JOINED',
      id: subscriberId,
      accuracy: subscriber.accuracy,
      latitude: subscriber.latitude,
      longitude: subscriber.longitude
    })

    if (this.status === 'CLOSED') {
      const row = getIndexOfClosestValue(
        this.matrixValues.latitude,
        sub.latitude
      )
      const column = getIndexOfClosestValue(
        this.matrixValues.longitude,
        sub.longitude
      )

      if (row && column) {
        this.subscribersMatrix[row][column].push(sub.sendMessage)

        this.notifyAdmin({
          type: 'USER_MATRIX_POSITION',
          id: subscriberId,
          row,
          column
        })
      }
    }

    return subscriberId
  }

  public unsubscribe(subId: string) {
    this.subscribers.delete(subId)

    this.notifyAdmin({
      type: 'USER_LEFT',
      id: subId
    })
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

  private initializeSubscribersMatrix(maxI: number, maxJ: number) {
    this.subscribersMatrix = Array.from({ length: maxI }, () =>
      Array.from({ length: maxJ }, () => [])
    )

    return Array.from({ length: maxI }, () =>
      Array.from({ length: maxJ }, () => 0)
    )
  }

  public getMatrix() {
    return this.subscribersMatrix
  }

  // Notes:
  //  1. There's probably a better way to do this
  //  2. I guess this method will block the loop in very large event.
  //     (Actually it did not, probably there will be a bottleneck on the WS connections first)
  //     If it is true, I think it can be done asynchronously
  private mapSubscribers() {
    const sortedUniqueLatitudes = getSortedUniqueAttributes(
      this.subscribers,
      'latitude'
    )

    const sortedUniqueLongitudes = getSortedUniqueAttributes(
      this.subscribers,
      'longitude'
    )

    // This values are keeped out of method to people join on event after it is closed
    this.matrixValues.latitude = sortedUniqueLatitudes
    this.matrixValues.longitude = sortedUniqueLongitudes

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

    const participantPerPixel = this.initializeSubscribersMatrix(
      sortedUniqueLatitudes.length,
      sortedUniqueLongitudes.length
    )

    this.subscribers.forEach((subscriber, id) => {
      const i = latitudeIndexMap.get(subscriber.latitude)
      const j = longitudeIndexMap.get(subscriber.longitude)

      if (i && j) {
        this.subscribersMatrix[i][j].push(subscriber.sendMessage)
        participantPerPixel[i][j]++

        this.notifyAdmin({
          type: 'USER_MATRIX_POSITION',
          id,
          row: i,
          column: j
        })
      }
    })

    return participantPerPixel
  }
}
