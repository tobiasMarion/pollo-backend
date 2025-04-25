import type { ConfinedParticle } from './draw/confined-particle'

export type Node = string
export type Edge = { from: Node; to: Node; value: number }

export type Graph = { nodes: Node[]; edges: Edge[] }
export type NodeParticles = Record<Node, ConfinedParticle>
