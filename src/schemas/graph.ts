import { z } from 'zod'

import type { ConfinedParticle } from '../services/graph/draw/confined-particle'
import { locationSchema } from './location'
import { vector3Schema } from './vectors'

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

export const positionSchema = z
  .object({
    relative: vector3Schema,
    absolute: vector3Schema
  })
  .optional()
  .nullable()

export const metadataSchema = z.object({
  location: locationSchema,
  position: positionSchema
})

export type NodePosition = z.infer<typeof positionSchema>
export type Metadata = z.infer<typeof metadataSchema>
