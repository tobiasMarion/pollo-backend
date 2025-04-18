import type { Location } from '@/schemas/messages'

export type Node = string
export type Edge = { from: Node; to: Node; value: number }

export type Graph = { nodes: Node[]; edges: Edge[] }
export type NodeLocationsMap = Record<Node, Location>
