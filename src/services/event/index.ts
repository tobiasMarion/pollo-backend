import type {
  Admin,
  Location,
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
      type: 'USER_JOINED',
      deviceId: subscriber.deviceId,
      location: subscriber.location
    })

    this.subscribers.set(subscriber.deviceId, subscriber)
  }

  public updateSubLocation(devideId: string, location: Location) {
    const sub = this.subscribers.get(devideId)

    if (!sub) {
      return
    }

    this.subscribers.set(devideId, { ...sub, location })
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
