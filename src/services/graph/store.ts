import type Redis from 'ioredis'

import type { Location } from '@/schemas/location'

import type { Edge, Node } from './types'

/* 
This class store Graphs on a Redis instance.
A Graph is defined by 1 set and 2 Hashes:
  1. Nodes: A set of nodes
  2. Edges: An hash which the name is the starting node, the key is ending node and the value is the weight (distance in this particular case)
  3. NodesLocation: An hash that store the cylinder which each node can move freely inside
*/
export class GraphStore {
  private redis: Redis
  private graphId: Node

  constructor(redisInstance: Redis, graphId: Node) {
    this.redis = redisInstance
    this.graphId = graphId
  }

  keyForNode(node: Node) {
    return `graph:${this.graphId}:${node}`
  }

  keyForNodesSet() {
    return `graph:${this.graphId}:nodes`
  }

  keyForNodesLocation() {
    return `graph:${this.graphId}:node_location`
  }

  async addNode(node: Node) {
    await this.redis.sadd(this.keyForNodesSet(), node)
  }

  async setNodeLocation(node: Node, location: Location) {
    const json = JSON.stringify(location)
    await this.redis.hset(this.keyForNodesLocation(), node, json)
  }

  async getNodeLocation(node: Node) {
    const json = await this.redis.hget(this.keyForNodesLocation(), node)
    return json ? JSON.parse(json) : null
  }

  async setEdge({ from, to, value }: Edge) {
    await this.addNode(from)
    await this.addNode(to)
    await this.redis.hset(this.keyForNode(from), to, value)
  }

  async removeEdge(from: Node, to: Node) {
    await this.redis.hdel(this.keyForNode(from), to)
  }

  async listNodes() {
    return await this.redis.smembers(this.keyForNodesSet())
  }

  async removeNode(node: Node) {
    const nodeKey = this.keyForNode(node)
    const allNodes = await this.listNodes()

    // Pipelines do many queries in just one round-trip
    const pipeline = this.redis.pipeline()

    // Remove node from node's set
    pipeline.srem(this.keyForNodesSet(), node)

    // Remove all input edges (otherNode -> node)
    for (const otherNode of allNodes) {
      const otherKey = this.keyForNode(otherNode)
      pipeline.hdel(otherKey, node)
    }

    // Remove all output edges (node -> otherNode)
    pipeline.del(nodeKey)
    pipeline.hdel(this.keyForNodesLocation(), node)

    await pipeline.exec()
  }

  async deleteGraph() {
    const nodes = await this.listNodes()
    const keys = nodes.map(node => this.keyForNode(node))
    keys.push(this.keyForNodesSet())
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }

  async listEdges() {
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
}
