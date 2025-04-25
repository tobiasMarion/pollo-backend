import { lengthSquared, normalize, scale, subtract } from '@/utils/vectors'

import type { Graph, NodeParticles } from '../types'
import { ConfinedParticle } from './confined-particle'

const ALMOST_ZERO = 1e-3 // Used to avoid division by 0

function applyEdgeElasticForce(
  p1: ConfinedParticle,
  p2: ConfinedParticle,
  restLength: number,
  springConstant: number = 1
) {
  const directionVector = subtract(p1.getPosition(), p2.getPosition())
  const distanceSquared = lengthSquared(directionVector) + ALMOST_ZERO

  const distance = Math.sqrt(distanceSquared)
  const directionUnit = normalize(directionVector)

  const displacement = distance - restLength
  const forceMagnitude = springConstant * displacement
  const elasticForce = scale(directionUnit, forceMagnitude)

  // A força puxa particleA em direção a B e vice-versa
  p1.applyForce(elasticForce)
  p2.applyForce(scale(elasticForce, -1))
}

export function draw3dGraph(
  { edges }: Graph,
  particles: NodeParticles,
  interactions: number = 1000
) {
  for (let index = 0; index < interactions; index++) {
    edges.forEach(({ from, to, value }) =>
      applyEdgeElasticForce(particles[from], particles[to], value)
    )

    let totalMomentum = 0

    for (const particle of Object.values(particles)) {
      totalMomentum += particle.computeAccumulatedForce()
    }

    if (totalMomentum === 0) return
  }
}
