import type { Vector3 } from '@/utils/vectors'

import type { Node } from '../types'
import type { ConfinedParticle } from './confined-particle'

export function quantize(value: number, precision: number = 0.25) {
  return Math.floor(value / precision)
}

export function createRankMap(values: number[]): Map<number, number> {
  return new Map(
    [...new Set(values)].sort((a, b) => a - b).map((val, idx) => [val, idx])
  )
}

interface ParticlePosition {
  absolute: Vector3
  relative: Vector3
}

export function quantizeAndRankParticles(
  particles: Record<Node, ConfinedParticle>
): Record<string, ParticlePosition> {
  const positions = Object.values(particles).map(p => p.getPosition())

  const xs = positions.map(pos => quantize(pos.x))
  const ys = positions.map(pos => quantize(pos.y))
  const zs = positions.map(pos => quantize(pos.z))

  const xRank = createRankMap(xs)
  const yRank = createRankMap(ys)
  const zRank = createRankMap(zs)

  const result: Record<string, ParticlePosition> = {}

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
