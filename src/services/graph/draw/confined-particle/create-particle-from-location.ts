import type { ExactLocation, Location } from '@/schemas/location'
import { getDisplacementOnEarth } from '@/utils/displacement-on-earth'

import { ConfinedParticle } from '.'

export function createParticleFromLocation(
  pointLocation: Location,
  baseLocation: ExactLocation
) {
  const { deltaEast, deltaNorth } = getDisplacementOnEarth(
    pointLocation,
    baseLocation
  )

  const position = {
    x: deltaEast,
    y: pointLocation.altitude,
    z: deltaNorth
  }

  return new ConfinedParticle({
    position,
    radius: pointLocation.horizontalAccuracy,
    deltaY: pointLocation.verticalAccuracy
  })
}
