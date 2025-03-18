import type {
  Admin,
  Message,
  SendMessage,
  Subscriber
} from '@/schemas/messages'

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

  public setAdminConnection(send: SendMessage) {
    this.admin.sendMessage = send
  }

  public getSubscribers() {
    return Array.from(this.subscribers, ([deviceId, { location }]) => ({
      deviceId,
      location
    }))
  }

  public notifyAdmin(message: Message) {
    if (this.admin.sendMessage) {
      this.admin.sendMessage(message)
    }
  }

  public publish(message: Message) {
    this.notifyAdmin(message)

    console.log(message)

    this.subscribers.forEach(sub => {
      sub.sendMessage(message)
    })
  }

  public subscribe(subscriber: Subscriber) {
    this.publish({
      type: 'NEW_SUB',
      deviceId: subscriber.deviceId
    })

    this.subscribers.set(subscriber.deviceId, subscriber)
  }

  public unsubscribe(deviceId: string) {
    const sub = this.subscribers.get(deviceId)

    if (!sub) {
      return
    }

    this.subscribers.delete(deviceId)

    this.publish({
      type: 'USER_LEFT',
      devideId: sub.deviceId
    })
  }
}
