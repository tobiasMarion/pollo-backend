import { describe, expect, it, vi } from 'vitest'

import { ConfinedParticle } from '.'
import { createParticleFromLocation } from './create-particle-from-location'

vi.mock('@/utils/displacement-on-earth', () => ({
  getDisplacementOnEarth: () => ({
    deltaEast: 11,
    deltaNorth: 12
  })
}))

describe('createParticleFromLocation', () => {
  it('should create a particle with correct position and constraints', () => {
    const particle = createParticleFromLocation(
      {
        latitude: 0,
        longitude: 0,
        altitude: 100,
        horizontalAccuracy: 10,
        verticalAccuracy: 5
      },
      {
        latitude: 0,
        longitude: 0
      }
    )

    expect(particle).toBeInstanceOf(ConfinedParticle)
    expect(particle.getPosition()).toEqual({
      x: 11,
      y: 100,
      z: 12
    })
  })
})
