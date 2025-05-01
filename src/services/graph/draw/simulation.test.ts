/**
 * Integration test for 3D graph reconstruction under noisy measurements.
 * Uses seeded random to ensure reproducibility.
 */
import seedrandom from 'seedrandom'
import { v4 as uuidv4 } from 'uuid'
import { beforeAll, describe, expect, it } from 'vitest'

import { randomNormal, randomTruncatedNormal } from '@/utils/random'
import {
  add,
  distanceBetweenPoints,
  randomVector,
  type Vector3
} from '@/utils/vectors'

import type { Edge, Node, NodeParticles } from '../types'
import { draw3dGraph } from '.'
import { ConfinedParticle } from './confined-particle'

// Seed the PRNG for deterministic tests
beforeAll(() => {
  seedrandom('simulation-test-seed', { global: true })
})

describe('Simulation', () => {
  const NODE_COUNT = 50
  const MIN_DIST_TO_CREATE_EDGE = 7

  // Position error parameters
  const POS_MIN = 4
  const POS_MAX = 12
  const POS_CENTER = 7
  const POS_SPREAD_FRAC = 1 / 3
  const POS_STD_DEV = (POS_MAX - POS_MIN) * POS_SPREAD_FRAC

  // Edge weight error parameters
  const EDGE_MAX_ERROR = 15
  const EDGE_SPREAD_FRAC = 1 / 3
  const EDGE_STD_DEV = EDGE_MAX_ERROR * EDGE_SPREAD_FRAC

  // Data holders
  let originalPoints: Record<Node, Vector3> = {}
  let edges: Edge[] = []
  let particlesWithErrors: NodeParticles = {}
  let edgesWithErrors: Edge[] = []

  beforeAll(() => {
    // 1. Generate original points uniformly in sphere radius 10
    originalPoints = {}
    for (let i = 0; i < NODE_COUNT; i++) {
      const node = uuidv4()
      originalPoints[node] = randomVector(10)
    }

    const nodes = Object.keys(originalPoints) as Node[]

    // 2. Build edges for pairs closer than threshold
    edges = []
    for (let i = 0; i < nodes.length - 1; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const from = nodes[i]
        const to = nodes[j]
        const dist = distanceBetweenPoints(
          originalPoints[from],
          originalPoints[to]
        )
        if (dist < MIN_DIST_TO_CREATE_EDGE) {
          edges.push({ from, to, value: dist })
          edges.push({ from: to, to: from, value: dist })
        }
      }
    }

    // 3. Create noisy particles
    particlesWithErrors = {}
    nodes.forEach(node => {
      // truncated normal for positional magnitude
      const magnitudeError = randomTruncatedNormal(
        POS_CENTER,
        POS_STD_DEV,
        POS_MIN,
        POS_MAX
      )
      // per-component gaussian noise with stdDev = magnitudeError/3
      const delta: Vector3 = {
        x: randomNormal(0, magnitudeError / 3),
        y: randomNormal(0, magnitudeError / 3),
        z: randomNormal(0, magnitudeError / 3)
      }
      particlesWithErrors[node] = new ConfinedParticle({
        position: add(originalPoints[node], delta),
        radius: magnitudeError,
        deltaZ: magnitudeError
      })
    })

    // 4. Perturb edge weights
    edgesWithErrors = edges.map(edge => {
      const weightError = randomNormal(0, EDGE_STD_DEV)
      return { ...edge, value: edge.value + weightError }
    })
  })

  it('reconstructs original positions with average error <= 1', () => {
    const nodes = Object.keys(originalPoints) as Node[]
    const resultMap = draw3dGraph(
      { nodes, edges: edgesWithErrors },
      particlesWithErrors
    )

    let totalError = 0
    nodes.forEach(node => {
      const orig = originalPoints[node]
      const recon = resultMap[node].getPosition()
      totalError += distanceBetweenPoints(orig, recon)
    })
    const avgError = totalError / NODE_COUNT

    console.log(`Average reconstruction error: ${avgError.toFixed(4)}`)
    expect(avgError).toBeGreaterThan(0)
    expect(avgError).toBeLessThanOrEqual(3)
  })
})
