import type { ExactLocation } from '@/schemas/location'
import type { Vector3 } from '@/schemas/vectors'
import { computeDisplacement } from '@/utils/displacement-on-earth'

import type {
  NodeParticles,
  NodesWithMetadata,
  SimulationResult,
  UncorrectedPositons
} from '../../../schemas/graph'

export function quantize(value: number, precision: number = 0.25) {
  return Math.floor(value / precision)
}

export function createRankMap(values: number[]): Map<number, number> {
  return new Map(
    [...new Set(values)].sort((a, b) => a - b).map((val, idx) => [val, idx])
  )
}

export function quantizeAndRankLocations(
  nodes: NodesWithMetadata,
  baseLocation: ExactLocation
): UncorrectedPositons {
  const displacementById = new Map<string, Vector3>()
  for (const [id, { location }] of Object.entries(nodes)) {
    displacementById.set(id, computeDisplacement(location, baseLocation))
  }

  const dxs: number[] = []
  const dys: number[] = []
  const dzs: number[] = []
  for (const { x, y, z } of displacementById.values()) {
    dxs.push(quantize(x))
    dys.push(quantize(y))
    dzs.push(quantize(z))
  }

  const dxRank = createRankMap(dxs)
  const dyRank = createRankMap(dys)
  const dzRank = createRankMap(dzs)

  const result: UncorrectedPositons = {}

  for (const [id, displacement] of displacementById.entries()) {
    const { x, y, z } = displacement

    result[id] = {
      absolute: { x, y, z },
      relative: {
        x: dxRank.get(quantize(x))!,
        y: dyRank.get(quantize(y))!,
        z: dzRank.get(quantize(z))!
      }
    }
  }

  return result
}

export function quantizeAndRankParticles(
  particles: NodeParticles
): SimulationResult {
  const positions = Object.values(particles).map(p => p.getPosition())

  const xs = positions.map(pos => quantize(pos.x))
  const ys = positions.map(pos => quantize(pos.y))
  const zs = positions.map(pos => quantize(pos.z))

  const xRank = createRankMap(xs)
  const yRank = createRankMap(ys)
  const zRank = createRankMap(zs)

  const result: SimulationResult = {}

  for (const [id, particle] of Object.entries(particles)) {
    const { x, y, z } = particle.getPosition()

    result[id] = {
      absolute: { x, y, z },
      relative: {
        x: xRank.get(quantize(x))!,
        y: yRank.get(quantize(y))!,
        z: zRank.get(quantize(z))!
      }
    }
  }

  return result
}
