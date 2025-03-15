import { randomUUID } from 'crypto'

interface EventServiceContructor {
  adminId: string
}

export class EventService {
  private admin: Admin
  private subscribers = new Map<string, Subscriber>()

  constructor({ adminId }: EventServiceContructor) {
    this.admin = {
      userId: adminId,
      sendMessage: undefined
    }
  }

  public getAdminId() {
    return this.admin.userId
  }

  public setAdminConnection(send: (string: string) => void) {
    this.admin.sendMessage = (message: Message) => {
      send(JSON.stringify(message))
    }
  }

  public getSubscribers() {
    return Array.from(
      this.subscribers,
      ([subscriberId, { deviceId, location }]) => ({
        subscriberId,
        deviceId,
        location
      })
    )
  }

  public notifyAdmin(message: Message) {
    if (this.admin.sendMessage) {
      this.admin.sendMessage(message)
    }
  }

  public publish(message: Message) {
    this.notifyAdmin(message)

    for (const subscriber of Object.values(this.subscribers)) {
      subscriber.sendMessage(JSON.stringify(message))
    }
  }

  public subscribe(subscriber: Subscriber): string {
    const subscriberId = randomUUID()

    const sub: Subscriber = {
      ...subscriber,
      sendMessage: (message: Message) => {
        subscriber.sendMessage(message)
      }
    }

    this.subscribers.set(subscriberId, sub)

    this.publish({
      type: 'USER_JOINED',
      subscriberId,
      deviceId: sub.deviceId,
      location: sub.location
    })

    return subscriberId
  }

  public unsubscribe(subscriberId: string) {
    const sub = this.subscribers.get(subscriberId)

    if (!sub) {
      return
    }

    this.publish({
      type: 'USER_LEFT',
      subscriberId,
      deviceId: sub.deviceId
    })
  }
}
