import type Redis from 'ioredis'

import type { ExactLocation, Location } from '@/schemas/location'
import type {
  Admin,
  Message,
  SendMessage,
  Subscriber
} from '@/schemas/messages.js'

import { draw3dGraph } from '../graph/draw'
import { SimulationScheduler } from '../graph/draw/simulation-scheduler'
import { GraphStore } from '../graph/store'

interface EventData {
  id: string
  location: ExactLocation
  adminId: string
}

interface EventServiceContructor {
  redis: Redis
  eventData: EventData
}

export class EventService {
  private id: string
  private location: ExactLocation
  private admin: Admin
  private subscribers = new Map<string, Subscriber>()

  private eventGraph: GraphStore
  private simulationScheduler: SimulationScheduler

  constructor({ redis, eventData }: EventServiceContructor) {
    const { id, location, adminId } = eventData

    this.eventGraph = new GraphStore(redis, id)
    this.simulationScheduler = new SimulationScheduler({
      run: this.runSimulation.bind(this),
      debounceMs: 500,
      maxWaitMs: 3000
    })

    this.id = id
    this.location = location
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

    this.subscribers.forEach(sub => {
      sub.sendMessage(message)
    })
  }

  private onGraphChanged() {
    this.simulationScheduler.notifyUpdate()
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
    this.eventGraph.setNodeLocation(deviceId, location)
    this.onGraphChanged()
  }

  public setDistanceToDevice(from: string, to: string, value: number | null) {
    if (!value) {
      this.eventGraph.removeEdge(from, to)
    } else {
      this.eventGraph.setEdge({ from, to, value })
    }

    this.onGraphChanged()
  }

  public updateSubLocation(devideId: string, location: Location) {
    const sub = this.subscribers.get(devideId)

    if (!sub) {
      return
    }

    this.subscribers.set(devideId, { ...sub, location })
    this.eventGraph.setNodeLocation(devideId, location)
    this.onGraphChanged()
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

    this.onGraphChanged()
  }

  private async runSimulation() {
    const [nodes, edges, nodeLocations] = await Promise.all([
      this.eventGraph.listNodes(),
      this.eventGraph.listEdges(),
      this.eventGraph.listNodeLocations()
    ])

    draw3dGraph({ nodes, edges }, nodeLocations, this.location)
  }
}
