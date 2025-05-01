import { v4 as uuidv4 } from 'uuid'
import { describe, expect, it } from 'vitest'

import { randIntBetween } from '@/utils/random'
import {
  add,
  distanceBetweenPoints,
  lengthSquared,
  randomVector,
  subtract,
  type Vector3
} from '@/utils/vectors'

import type { Edge, Node, NodeParticles } from '../types'
import { draw3dGraph } from '.'
import { ConfinedParticle } from './confined-particle'

describe('Simulation', () => {
  const amountOfNodes = 50
  const originalPoints: Record<Node, Vector3> = {}
  const edges: Edge[] = []
  const minDistanceToCreateEdge = 7

  // Generate data without error
  for (let i = 0; i < amountOfNodes; i++) {
    const node = uuidv4()

    const point = randomVector(10)
    originalPoints[node] = point
  }

  const nodes = Object.keys(originalPoints)

  for (let i = 0; i < amountOfNodes - 1; i++) {
    const p1 = originalPoints[nodes[i]]

    for (let j = i + 1; j < amountOfNodes; j++) {
      const p2 = originalPoints[nodes[j]]

      const distance = Math.sqrt(lengthSquared(subtract(p1, p2)))

      if (distance < minDistanceToCreateEdge) {
        edges.push({ from: nodes[i], to: nodes[j], value: distance })
        edges.push({ from: nodes[j], to: nodes[i], value: distance })
      }
    }
  }

  // Create particles adding errors to their position
  const particlesWithErrors: NodeParticles = {}
  nodes.forEach(node => {
    const error = randIntBetween(3, 10)
    const deltaP = randomVector(error)

    particlesWithErrors[node] = new ConfinedParticle({
      position: add(originalPoints[node], deltaP),
      radius: error,
      deltaZ: error
    })
  })

  const edgesWithErrors = edges.map(edge => {
    const error = randIntBetween(-30, 30) / 100

    return { ...edge, value: edge.value + error }
  })

  describe('Run', () => {
    it('Should reconstruct the original position using the wrong ones', () => {
      const result = draw3dGraph(
        { nodes, edges: edgesWithErrors },
        particlesWithErrors
      )

      let totalError = 0

      const tableData = nodes.map(node => {
        const original = originalPoints[node]
        const resultPos = result[node].getPosition()
        const error = distanceBetweenPoints(original, resultPos)
        totalError += error

        return {
          node: node.substring(0, 8),
          originalX: original.x.toFixed(5),
          resultX: resultPos.x.toFixed(5),
          originalY: original.y.toFixed(5),
          resultY: resultPos.y.toFixed(5),
          originalZ: original.z.toFixed(5),
          resultZ: resultPos.z.toFixed(5),
          error
        }
      })
      const averageError = totalError / amountOfNodes

      console.table(tableData)
      console.log('Average Error: ', averageError)
      expect(averageError).toBeLessThan(1.3)
    })
  })
})
