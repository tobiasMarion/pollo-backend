import type { Location } from '@/schemas/messages'
import { displacementOnEarth } from '@/utils/displacement-on-earth'
import { minMax } from '@/utils/min-max'

import type { Vector3 } from './types'

// Represents a point that can move freely inside a cilinder, but not get out of it
export class ConfinedParticle {
  private x: number
  private y: number
  private z: number

  private baseX: number
  private baseY: number
  private radius: number

  private maxZ: number
  private minZ: number

  constructor(pointLocation: Location, baseLocation: Location) {
    this.z = pointLocation.altitude
    this.minZ = pointLocation.altitude - pointLocation.verticalAccuracy
    this.maxZ = pointLocation.altitude + pointLocation.verticalAccuracy

    const { deltaEast, deltaNorth } = displacementOnEarth(
      pointLocation,
      baseLocation
    )

    this.x = deltaEast
    this.baseX = deltaEast

    this.y = deltaNorth
    this.baseY = deltaNorth

    this.radius = pointLocation.horizontalAccuracy
  }

  public moveTo({ x, y, z }: Vector3) {
    const clampedZ = minMax(z, this.minZ, this.maxZ)

    let clampedX = x
    let clampedY = y

    const distanceFromCenter = Math.sqrt(x * x + y * y)

    if (distanceFromCenter > this.radius) {
      const scale = this.radius / distanceFromCenter
      clampedX = x * scale
      clampedY = y * scale
    }

    this.x = clampedX
    this.y = clampedY
    this.z = clampedZ
  }

  public moveBy({ x, y, z }: Vector3) {
    const newX = this.x + x
    const newY = this.y + y
    const newZ = this.z + z
    this.moveTo({ x: newX, y: newY, z: newZ })
  }
}
