import type Redis from 'ioredis'

import type {
  Admin,
  Location,
  Message,
  SendMessage,
  Subscriber
} from '@/schemas/messages'

import { GraphStore } from './graph'

interface EventData {
  id: string
  adminId: string
}

interface EventServiceContructor {
  redis: Redis
  eventData: EventData
}

export class EventService {
  private id: string
  private admin: Admin
  private subscribers = new Map<string, Subscriber>()
  private eventGraph: GraphStore

  constructor({ redis, eventData }: EventServiceContructor) {
    const { adminId, id } = eventData

    this.eventGraph = new GraphStore(redis, id)

    this.id = id
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
    const { deviceId, location } = subscriber

    this.publish({
      type: 'USER_JOINED',
      deviceId,
      location
    })

    this.subscribers.set(deviceId, subscriber)
    this.eventGraph.addNode(deviceId)
  }

  public setDistanceToDevice(from: string, to: string, value: number | null) {
    if (!value) {
      this.eventGraph.removeEdge(from, to)
      return
    }

    this.eventGraph.setEdge(from, to, value)
  }

  public updateSubLocation(devideId: string, location: Location) {
    const sub = this.subscribers.get(devideId)

    if (!sub) {
      return
    }

    this.subscribers.set(devideId, { ...sub, location })
    this.eventGraph.setNodeLocation(devideId, location)
  }

  public unsubscribe(deviceId: string) {
    const sub = this.subscribers.get(deviceId)

    if (!sub) {
      return
    }

    this.subscribers.delete(deviceId)
    this.eventGraph.removeNode(deviceId)

    this.publish({
      type: 'USER_LEFT',
      devideId: sub.deviceId
    })
  }
}
