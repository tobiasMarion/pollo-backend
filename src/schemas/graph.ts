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

export const positionPair = z.object({
  relative: vector3Schema,
  absolute: vector3Schema
})
export type PositionPair = z.infer<typeof positionPair>
export type SimulationResult = Record<Node, PositionPair>

export type UncorrectedPositon = z.infer<typeof positionPair>
export type UncorrectedPositons = Record<Node, UncorrectedPositon>

export const positionSchema = z.object({
  uncorrected: positionPair,
  simulated: positionPair
})

export const metadataSchema = z.object({
  location: locationSchema,
  position: positionSchema.nullish()
})

export type NodePosition = z.infer<typeof positionSchema>
export type Metadata = z.infer<typeof metadataSchema>
export type NodesWithMetadata = Record<Node, Metadata>
