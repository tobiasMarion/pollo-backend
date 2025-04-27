import { lengthSquared, normalize, scale, subtract } from '@/utils/vectors'

import type { Graph, NodeParticles } from '../types'
import { ConfinedParticle } from './confined-particle'

const ALMOST_ZERO = 1e-3 // Used to avoid division by 0

function applyEdgeElasticForce(
  p1: ConfinedParticle,
  p2: ConfinedParticle,
  restLength: number,
  springConstant: number = 0.0005
) {
  const directionVector = subtract(p2.getPosition(), p1.getPosition())
  const distanceSquared = lengthSquared(directionVector) + ALMOST_ZERO

  const distance = Math.sqrt(distanceSquared)

  if (distance < ALMOST_ZERO) return

  const directionUnit = normalize(directionVector)

  const displacement = distance - restLength
  const forceMagnitude = springConstant * displacement

  const elasticForce = scale(directionUnit, forceMagnitude)

  p1.applyForce(elasticForce)
  p2.applyForce(scale(elasticForce, -1))
}

export function draw3dGraph(
  { edges }: Graph,
  particles: NodeParticles,
  interactions: number = 1000
) {
  const start = Date.now()
  for (let index = 0; index < interactions; index++) {
    edges.forEach(({ from, to, value }) => {
      const p1 = particles[from]
      const p2 = particles[to]

      if (!p1 || !p2) return

      applyEdgeElasticForce(p1, p2, value)
    })

    let totalMomentum = 0

    for (const particle of Object.values(particles)) {
      totalMomentum += particle.computeAccumulatedForce()
    }

    if (totalMomentum < ALMOST_ZERO) break
  }

  console.log(`Simulation took: ${Date.now() - start} ms`)
  return particles
}
