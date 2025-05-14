import type Redis from 'ioredis'

import type { ExactLocation, Location } from '@/schemas/location'
import type {
  Admin,
  Message,
  SendMessage,
  Subscriber
} from '@/schemas/messages.js'

import { draw3dGraph } from '../graph/draw'
import { createParticleFromLocation } from '../graph/draw/confined-particle/create-particle-from-location'
import { quantizeAndRankParticles } from '../graph/draw/quatizes'
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
  private subscribers = new Map<string, SendMessage>()

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

  public async getSubscribers() {
    const metadata = await this.eventGraph.listNodesMetadata()

    return Object.entries(metadata).map(([deviceId, data]) => ({
      deviceId,
      location: data.location
    }))
  }

  public async getGraphEdges() {
    const edges = await this.eventGraph.listEdges()

    return edges
  }

  public notifyAdmin(message: Message) {
    if (this.admin.sendMessage) {
      this.admin.sendMessage(message)
    }
  }

  public publish(message: Message) {
    this.notifyAdmin(message)

    this.subscribers.forEach(sendMessage => {
      sendMessage(message)
    })
  }

  private onGraphChanged() {
    this.simulationScheduler.notifyUpdate()
  }

  public subscribe({ deviceId, location, sendMessage }: Subscriber) {
    this.publish({
      type: 'USER_JOINED',
      deviceId,
      location
    })

    this.subscribers.set(deviceId, sendMessage)
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

    this.notifyAdmin({
      type: 'DISTANCE_REPORT',
      from,
      to,
      distance: value
    })

    this.onGraphChanged()
  }

  public updateSubLocation(deviceId: string, location: Location) {
    const sub = this.subscribers.get(deviceId)

    if (!sub) {
      return
    }

    this.notifyAdmin({ type: 'LOCATION_UPDATE_REPORT', deviceId, location })
    this.eventGraph.setNodeLocation(deviceId, location)
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
      deviceId
    })

    this.onGraphChanged()
  }

  public async getEventGraph() {
    return await this.eventGraph.getEventGraph()
  }

  private async runSimulation() {
    const [nodesWithMetadata, edges] = await Promise.all([
      this.eventGraph.listNodesMetadata(),
      this.eventGraph.listEdges()
    ])

    const nodes = Object.keys(nodesWithMetadata)
    const particles = Object.fromEntries(
      nodes.map(node => [
        node,
        createParticleFromLocation(
          nodesWithMetadata[node].location,
          this.location
        )
      ])
    )

    const simulationResult = draw3dGraph({ nodes, edges }, particles)
    const positions = quantizeAndRankParticles(simulationResult)

    nodes.forEach(particle => {
      const notifySub = this.subscribers.get(particle)
      const position = positions[particle]

      if (notifySub && position) {
        this.eventGraph.setNodePosition(particle, position)

        notifySub({
          type: 'SET_POINT',
          ...position
        })

        this.notifyAdmin({
          type: 'SET_POINT_REPORT',
          deviceId: particle,
          ...position
        })
      }
    })
  }
}
