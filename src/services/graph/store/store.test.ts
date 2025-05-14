import { randomUUID } from 'node:crypto'

import RedisMock from 'ioredis-mock'
import { beforeEach, describe, expect, it } from 'vitest'

import type { Edge, Node, NodePosition } from '@/schemas/graph'
import type { Location } from '@/schemas/location'
import { vectorNull } from '@/schemas/vectors'

import { GraphStore } from '.'

describe('GraphStore', () => {
  let redis = new RedisMock()
  let store: GraphStore
  let graphId: string

  const mockLocation: Location = {
    latitude: 0,
    longitude: 0,
    altitude: 0,
    horizontalAccuracy: 0,
    verticalAccuracy: 0
  }

  const mockPosition: NodePosition = {
    absolute: vectorNull(),
    relative: vectorNull()
  }

  beforeEach(() => {
    graphId = randomUUID()
    redis = new RedisMock()
    store = new GraphStore(redis, graphId)
  })

  it('should add a new Node', async () => {
    const node = 'node1'
    await store.addNode(node)
    const nodes = await store.listNodes()
    expect(nodes).toContain(node)
  })

  it('should set a node location', async () => {
    const node = 'node1'
    await store.setNodeLocation(node, mockLocation)
    const metadata = await store.getNodeMetadata(node)
    expect(metadata).toEqual({ location: mockLocation, position: undefined })
  })

  it('should set a node position', async () => {
    const node = 'node1'
    await store.setNodeLocation(node, mockLocation)
    await store.setNodePosition(node, mockPosition)
    const metadata = await store.getNodeMetadata(node)
    expect(metadata).toEqual({ location: mockLocation, position: mockPosition })
  })

  it('should not set a node position with invalid location', async () => {
    const node = 'node1'
    await store.setNodePosition(node, mockPosition)
    const metadata = await store.getNodeMetadata(node)
    expect(metadata).toEqual(null)
  })

  it('shout list nodes', async () => {
    const nodes = ['n1', 'n2']
    nodes.forEach(async node => {
      await store.addNode(node)
    })

    const response = await store.listNodes()
    expect(response.sort()).toEqual(nodes.sort())
  })

  it('shoud add an edge', async () => {
    const from: Node = 'node1'
    const to: Node = 'node2'
    const value = 1.23
    const edge: Edge = { from, to, value }
    await store.setEdge(edge)
    const edges = await store.listEdges()
    expect(edges).toEqual(expect.arrayContaining([edge]))
  })

  it('should remove an edge', async () => {
    const from: Node = 'node1'
    const to: Node = 'node2'
    const value = 1.23
    const edge: Edge = { from, to, value }
    await store.setEdge(edge)
    await store.removeEdge(from, to)
    const edges = await store.listEdges()
    expect(edges).not.toEqual(expect.arrayContaining([edge]))
  })

  it('should remove a node', async () => {
    const node: Node = 'node1'
    await store.addNode(node)
    await store.removeNode(node)
    const nodes = await store.listNodes()
    expect(nodes).not.toEqual(expect.arrayContaining([node]))
  })

  it('should delete graph', async () => {
    const node: Node = 'node1'
    await store.addNode(node)
    await store.deleteGraph()
    const nodes = await store.listNodes()
    expect(nodes).toHaveLength(0)
  })

  it('should list edges', async () => {
    const from: Node = 'node1'
    const to: Node = 'node2'
    const value = 1.23
    await store.setEdge({ from, to, value })
    const edges = await store.listEdges()
    expect(edges).toEqual(expect.arrayContaining([{ from, to, value }]))
  })

  it('should get event graph', async () => {
    const node: Node = 'node1'
    await store.setNodeLocation(node, mockLocation)
    await store.setNodePosition(node, mockPosition)
    const edge: Edge = { from: node, to: 'node2', value: 1.23 }
    await store.setEdge(edge)
    const graph = await store.getEventGraph()
    expect(graph.nodes[node]).toEqual({
      location: mockLocation,
      position: mockPosition
    })
    expect(graph.edges).toEqual([edge])
  })
})
