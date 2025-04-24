import { beforeEach, describe, expect, it } from 'vitest'

import { ConfinedParticle } from '.'

describe('ConfinedParticle', () => {
  // Mock data for testing
  const pointLocation = {
    latitude: 0,
    longitude: 0,
    altitude: 100,
    horizontalAccuracy: 10,
    verticalAccuracy: 5
  }

  const baseLocation = {
    latitude: 0,
    longitude: 0
  }

  let particle: ConfinedParticle

  beforeEach(() => {
    // Create a fresh particle for each test
    particle = new ConfinedParticle(pointLocation, baseLocation)
  })

  describe('constructor', () => {
    it('should initialize with the correct position and constraints', () => {
      const position = particle.getPosition()

      // Position should be at the center initially
      expect(position.x).toBe(0)
      expect(position.y).toBe(0)
      expect(position.z).toBe(100)
    })
  })

  describe('moveTo', () => {
    it('should allow movement within the cylinder', () => {
      // Move within bounds
      particle.moveTo({ x: 5, y: 5, z: 100 })

      const position = particle.getPosition()
      expect(position.x).toBe(5)
      expect(position.y).toBe(5)
      expect(position.z).toBe(100)
    })

    it('should clamp vertical movement within bounds', () => {
      // Move beyond the vertical bounds
      particle.moveTo({ x: 0, y: 0, z: 200 })

      const position = particle.getPosition()
      expect(position.z).toBe(105) // maxZ = altitude + verticalAccuracy = 100 + 5

      // Move below the minimum
      particle.moveTo({ x: 0, y: 0, z: 80 })

      const newPosition = particle.getPosition()
      expect(newPosition.z).toBe(95) // minZ = altitude - verticalAccuracy = 100 - 5
    })

    it('should constrain horizontal movement to the cylinder radius', () => {
      // Move beyond the radius
      particle.moveTo({ x: 20, y: 0, z: 100 })

      const position = particle.getPosition()
      expect(position.x).toBe(10) // radius = 10
      expect(position.y).toBe(0)

      // Move diagonally beyond the radius
      particle.moveTo({ x: 10, y: 10, z: 100 })

      const newPosition = particle.getPosition()
      // Distance should be approximately the radius
      const distance = Math.sqrt(
        newPosition.x * newPosition.x + newPosition.y * newPosition.y
      )
      expect(distance).toBeCloseTo(10, 1) // radius = 10, with some floating point tolerance
    })
  })

  describe('moveBy', () => {
    it('should apply relative movement within constraints', () => {
      expect(particle.getPosition()).toEqual({ x: 0, y: 0, z: 100 })

      // Move by a vector
      particle.moveBy({ x: 5, y: 3, z: 2 })

      const position = particle.getPosition()
      expect(position.x).toBe(5)
      expect(position.y).toBe(3)
      expect(position.z).toBe(102)
    })

    it('should constrain relative movement to the cylinder', () => {
      // Move to edge of cylinder
      particle.moveTo({ x: 10, y: 0, z: 100 })

      // Try to move further out
      particle.moveBy({ x: 5, y: 0, z: 0 })

      const position = particle.getPosition()
      expect(position.x).toBe(10) // Should remain at the boundary
      expect(position.y).toBe(0)
    })
  })

  describe('applyForce and computeAccumulatedForce', () => {
    it('should accumulate forces correctly', () => {
      // Apply multiple forces
      particle.applyForce({ x: 1, y: 2, z: 3 })
      particle.applyForce({ x: 4, y: 5, z: 6 })

      // Expected accumulated force vector: (5, 7, 9)
      // Expected magnitude: sqrt(5² + 7² + 9²) = sqrt(155) ≈ 12.45
      const magnitude = particle.computeAccumulatedForce()

      expect(magnitude).toBeCloseTo(Math.sqrt(155), 2)

      // Position should be updated by the accumulated force
      const position = particle.getPosition()
      expect(position.x).toBe(5)
      expect(position.y).toBe(7)
      expect(position.z).toBe(105)
    })

    it('should reset forces after computation', () => {
      // Apply force and compute
      particle.applyForce({ x: 1, y: 1, z: 1 })
      particle.computeAccumulatedForce()

      // Record position after first force application
      const positionAfterFirstForce = particle.getPosition()

      // Apply zero force and compute
      particle.computeAccumulatedForce()

      // Position should not change after second computation
      const positionAfterSecondForce = particle.getPosition()
      expect(positionAfterSecondForce).toEqual(positionAfterFirstForce)
    })
  })

  describe('complex scenarios', () => {
    it('should handle movement with an offset center', () => {
      // Create a particle with a different center
      const offsetPointLocation = {
        ...pointLocation,
        latitude: 0.0001, // This will create an offset after displacementOnEarth
        longitude: 0.0001
      }

      // Mocking displacementOnEarth result for this test
      // In a real test, you might need to mock the displacementOnEarth function
      const particleWithOffset = new ConfinedParticle(
        offsetPointLocation,
        baseLocation
      )

      // Now the particle is in somewhere around (11, 11, 100)
      // Moving it by 20, 20, 20, should cap the movemnt to the radius (10 and the verticalError of 5)
      particleWithOffset.moveBy({ x: 20, y: 20, z: 100 })

      const position = particleWithOffset.getPosition()
      // The exact values would depend on displacementOnEarth, but we expect
      // the position to be constrained to the cylinder
      expect(Math.abs(position.x)).toBeLessThanOrEqual(20)
      expect(Math.abs(position.y)).toBeLessThanOrEqual(20)
      expect(position.z).toBe(105)
    })

    it('should maintain constraints when moving by multiple vectors', () => {
      // Series of movements to test constraint maintenance
      particle.moveBy({ x: 4, y: 0, z: 0 })
      particle.moveBy({ x: 4, y: 0, z: 0 })
      particle.moveBy({ x: 4, y: 0, z: 0 })

      const position = particle.getPosition()
      // Should be constrained to radius 10
      expect(position.x).toBeLessThanOrEqual(10)

      // Now move in another direction
      particle.moveBy({ x: 0, y: 15, z: 0 })

      const newPosition = particle.getPosition()
      // Distance from center should be at most the radius
      const distance = Math.sqrt(
        newPosition.x * newPosition.x + newPosition.y * newPosition.y
      )
      expect(distance).toBeLessThanOrEqual(10 + 1e-10) // Adding small epsilon for floating point comparison
    })
  })
})
