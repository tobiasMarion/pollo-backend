import type { ExactLocation, Location } from '@/schemas/location'
import { displacementOnEarth } from '@/utils/displacement-on-earth'
import { minMax } from '@/utils/min-max'
import { add, type Vector3 } from '@/utils/vectors'

// Represents a point that can move freely inside a cilinder, but not get out of it
export class ConfinedParticle {
  private position: Vector3

  private baseX: number
  private baseY: number
  private radius: number

  private maxZ: number
  private minZ: number

  private forces: Vector3 = { x: 0, y: 0, z: 0 }

  constructor(pointLocation: Location, baseLocation: ExactLocation) {
    const z = pointLocation.altitude
    this.minZ = pointLocation.altitude - pointLocation.verticalAccuracy
    this.maxZ = pointLocation.altitude + pointLocation.verticalAccuracy

    const { deltaEast, deltaNorth } = displacementOnEarth(
      pointLocation,
      baseLocation
    )

    const x = deltaEast
    this.baseX = deltaEast

    const y = deltaNorth
    this.baseY = deltaNorth

    this.position = { x, y, z }

    this.radius = pointLocation.horizontalAccuracy
  }

  public getPosition(): Vector3 {
    return this.position
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

    this.position = {
      x: clampedX,
      y: clampedY,
      z: clampedZ
    }
  }

  public moveBy(vector: Vector3) {
    const newPosition = add(this.position, vector)
    this.moveTo(newPosition)
  }

  public applyForce(vector: Vector3) {
    this.forces = add(this.forces, vector)
  }

  public computeAccumulatedForce() {
    this.moveBy(this.forces)

    this.forces = { x: 0, y: 0, z: 0 }
  }
}
