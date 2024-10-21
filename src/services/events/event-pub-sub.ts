import type { EventStatus } from '@prisma/client'
import { randomUUID } from 'crypto'

export class EventPubSub {
  private admin: Admin
  private status: EventStatus
  private subscribers: Record<string, Subscriber>

  constructor({
    status = 'OPEN',
    adminId
  }: {
    status?: EventStatus
    adminId: string
  }) {
    this.status = status
    this.subscribers = {}
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
    this.subscribers[subscriberId] = subscriber

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
}
