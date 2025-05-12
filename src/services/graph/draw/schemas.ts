import { z } from 'zod'

import type { ConfinedParticle } from './confined-particle'

export const nodeSchema = z.string()
export const edgeSchema = z.object({
  from: nodeSchema,
  to: nodeSchema,
  value: z.number()
})

export type Node = z.infer<typeof nodeSchema>
export type Edge = z.infer<typeof edgeSchema>

export type Graph = { nodes: Node[]; edges: Edge[] }
export type NodeParticles = Record<Node, ConfinedParticle>
