import type { Location } from '@/schemas/messages'
import { minMax } from '@/utils/min-max'
import { lengthSquared, scale, subtract } from '@/utils/vectors'

import type { Graph, Node, NodeLocationsMap } from '../types'
import { ConfinedParticle } from './confined-particle'

function applyRepulsionForce(
  p1: ConfinedParticle,
  p2: ConfinedParticle,
  k = 0.1, // Ideal distance between particles
  maxForce = 1.0, // Used to soft the simmulation
  epsilon = 1e-4 // Used to avoid division by 0
) {
  const direction = subtract(p1.getPosition(), p2.getPosition())
  const distSq = lengthSquared(direction) + epsilon
  const dist = Math.sqrt(distSq)

  let forceMagnitude = (k * k) / distSq
  forceMagnitude = Math.min(forceMagnitude, maxForce)

  const forceDir = scale(direction, 1 / dist)
  const force = scale(forceDir, forceMagnitude)

  p1.applyForce(force)
  p2.applyForce(scale(force, -1))
}

function applyEdgeAttractionForce(
  p1: ConfinedParticle,
  p2: ConfinedParticle,
  idealDistance: number,
  stiffness = 0.5,
  maxForce = 10,
  epsilon = 1e-4
) {
  const direction = subtract(p2.getPosition(), p1.getPosition())
  const distSq = lengthSquared(direction) + epsilon
  const dist = Math.sqrt(distSq)
  if (dist === 0) return

  // Linear spring: F = –stiffness * (dist – idealDistance)
  const raw = (dist - idealDistance) * stiffness
  const fmag = minMax(raw, -maxForce, maxForce)

  const fdir = scale(direction, 1 / dist)
  const force = scale(fdir, fmag)

  // Since the graph is made of pairs of edges, each on will only affect only the first node
  p1.applyForce(force)
}

export function draw3dGraph(
  { nodes, edges }: Graph,
  nodeLocations: NodeLocationsMap,
  baseLocation: Location,
  iterations: number = 1000
) {
  const amountOfNodes = nodes.length
  const particles: Record<Node, ConfinedParticle> = {}

  nodes.forEach(node => {
    particles[node] = new ConfinedParticle(nodeLocations[node], baseLocation)
  })

  for (let iteration = 0; iteration < iterations; iteration++) {
    for (let i = 0; i < amountOfNodes - 1; i++) {
      const nodeI = nodes[i]
      const p1 = particles[nodeI]

      for (let j = i + 1; j < amountOfNodes; j++) {
        const nodeJ = nodes[j]
        const p2 = particles[nodeJ]

        applyRepulsionForce(p1, p2)
      }
    }

    edges.forEach(({ from, to, value }) => {
      const p1 = particles[from]
      const p2 = particles[to]

      applyEdgeAttractionForce(p1, p2, value)
    })

    for (const node in particles) {
      const particle = particles[node]

      particle.computeAccumulatedForce()
    }
  }
}
