import type Redis from 'ioredis'

import {
  type Edge,
  type Metadata,
  metadataSchema,
  type Node,
  type NodePosition,
  type NodesWithMetadata
} from '@/schemas/graph'
import type { Location } from '@/schemas/location'

const TTL_SECONDS = 43200 // 12 hours

export class GraphStore {
  private redis: Redis
  private graphId: string

  constructor(redisInstance: Redis, graphId: string) {
    this.redis = redisInstance
    this.graphId = graphId
  }

  private keyForNode(node: Node) {
    return `graph:${this.graphId}:edges:${node}`
  }

  private keyForNodesSet() {
    return `graph:${this.graphId}:nodes`
  }

  private keyForNodeMetadata() {
    return `graph:${this.graphId}:node_metadata`
  }

  async addNode(node: Node) {
    const key = this.keyForNodesSet()
    await this.redis.sadd(key, node)
    this.redis.expire(key, TTL_SECONDS)
  }

  async setNodeLocation(node: Node, location: Location) {
    const existing = await this.getNodeMetadata(node)
    const updated: Metadata = {
      location,
      position: existing?.position
    }

    const key = this.keyForNodeMetadata()
    await this.redis.hset(key, node, JSON.stringify(updated))
    this.redis.expire(key, TTL_SECONDS)
  }

  async setNodePosition(node: Node, position: NodePosition) {
    const existing = await this.getNodeMetadata(node)
    if (!existing) return
    const updated: Metadata = {
      location: existing.location,
      position
    }
    const key = this.keyForNodeMetadata()
    await this.redis.hset(key, node, JSON.stringify(updated))
    this.redis.expire(key, TTL_SECONDS)
  }

  async getNodeMetadata(node: Node): Promise<Metadata | null> {
    const json = await this.redis.hget(this.keyForNodeMetadata(), node)
    return json ? JSON.parse(json) : null
  }

  async listNodesMetadata(): Promise<NodesWithMetadata> {
    const nodes = await this.listNodes()
    const pipeline = this.redis.pipeline()

    for (const node of nodes) {
      pipeline.hget(this.keyForNodeMetadata(), node)
    }

    const results = await pipeline.exec()

    if (!results) {
      throw new Error('Failed to execute Redis pipeline')
    }

    const metadataMap: NodesWithMetadata = {}

    for (let i = 0; i < results.length; i++) {
      const [err, json] = results[i]
      if (err || typeof json !== 'string') continue

      const node = nodes[i]
      const metadata = JSON.parse(json)

      const { data, error, success } = metadataSchema.safeParse(metadata)
      if (!success) {
        console.log(error)
        continue
      }

      metadataMap[node] = data
    }

    return metadataMap
  }

  async setEdge({ from, to, value }: Edge) {
    await this.addNode(from)
    await this.addNode(to)

    const key = this.keyForNode(from)
    await this.redis.hset(key, to, value)
    this.redis.expire(key, TTL_SECONDS)
  }

  async removeEdge(from: Node, to: Node) {
    const key = this.keyForNode(from)
    await this.redis.hdel(key, to)
    this.redis.expire(key, TTL_SECONDS)
  }

  async listNodes() {
    return await this.redis.smembers(this.keyForNodesSet())
  }

  async removeNode(node: Node) {
    const nodeKey = this.keyForNode(node)
    const allNodes = await this.listNodes()
    const metadataKey = this.keyForNodeMetadata()

    const pipeline = this.redis.pipeline()

    pipeline.srem(this.keyForNodesSet(), node)

    for (const otherNode of allNodes) {
      const otherKey = this.keyForNode(otherNode)
      pipeline.hdel(otherKey, node)
      pipeline.expire(otherKey, TTL_SECONDS)
    }

    pipeline.del(nodeKey)
    pipeline.hdel(metadataKey, node)
    pipeline.expire(metadataKey, TTL_SECONDS)
    pipeline.expire(this.keyForNodesSet(), TTL_SECONDS)

    await pipeline.exec()
  }

  async deleteGraph() {
    const nodes = await this.listNodes()
    const keys = nodes.map(node => this.keyForNode(node))
    keys.push(this.keyForNodesSet())
    keys.push(this.keyForNodeMetadata())

    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async listEdges(): Promise<Edge[]> {
    const edges: Edge[] = []
    const nodes = await this.listNodes()
    const pipeline = this.redis.pipeline()

    for (const from of nodes) {
      pipeline.hgetall(this.keyForNode(from))
    }

    const results = await pipeline.exec()
    if (!results) {
      throw new Error('Failed to execute Redis pipeline')
    }

    for (let i = 0; i < results.length; i++) {
      const [error, rawNeighbors] = results[i]
      if (error) continue

      const from = nodes[i]
      const neighbors = rawNeighbors as Record<Node, Node>

      for (const to in neighbors) {
        const value = parseFloat(neighbors[to])
        edges.push({ from, to, value })
      }
    }

    return edges
  }

  async getEventGraph() {
    const [nodes, edges, metadata] = await Promise.all([
      this.listNodes(),
      this.listEdges(),
      this.listNodesMetadata()
    ])

    const nodesWithMetadata: Record<string, Metadata> = {}

    for (const node of nodes) {
      try {
        const nodeMetadata = metadata[node]
        if (nodeMetadata) {
          nodesWithMetadata[node] = nodeMetadata
        }
      } catch (error) {
        console.error(`Error parsing metadata for node ${node}:`, error)
      }
    }

    return {
      nodes: nodesWithMetadata,
      edges: edges || []
    }
  }
}
