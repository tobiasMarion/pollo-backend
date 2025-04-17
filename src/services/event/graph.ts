import type Redis from 'ioredis'

import type { Location } from '@/schemas/messages'

/* 
This class store Graphs on a Redis instance.
A Graph is defined by 1 set and 2 Hashes:
  1. Nodes: A set of nodes
  2. Edges: An hash which the name is the starting node, the key is ending node and the value is the weight (distance in this particular case)
  3. NodesLocation: An hash that store the cylinder which each node can move freely inside
*/

export class GraphStore {
  private redis: Redis
  private graphId: string

  constructor(redisInstance: Redis, graphId: string) {
    this.redis = redisInstance
    this.graphId = graphId
  }

  keyForNode(node: string) {
    return `graph:${this.graphId}:${node}`
  }

  keyForNodesSet() {
    return `graph:${this.graphId}:nodes`
  }

  keyForNodesLocation() {
    return `graph:${this.graphId}:node_location`
  }

  async addNode(node: string) {
    await this.redis.sadd(this.keyForNodesSet(), node)
  }

  async setNodeLocation(node: string, location: Location) {
    const json = JSON.stringify(location)
    await this.redis.hset(this.keyForNodesLocation(), node, json)
  }

  async getNodeLocation(node: string) {
    const json = await this.redis.hget(this.keyForNodesLocation(), node)
    return json ? JSON.parse(json) : null
  }

  async setEdge(from: string, to: string, weight: number) {
    await this.addNode(from)
    await this.addNode(to)
    await this.redis.hset(this.keyForNode(from), to, weight)
  }

  async removeEdge(from: string, to: string) {
    await this.redis.hdel(this.keyForNode(from), to)
  }

  async listNodes() {
    return await this.redis.smembers(this.keyForNodesSet())
  }

  async removeNode(node: string) {
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
}
