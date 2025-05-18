import {
  add,
  distanceBetweenPoints,
  lengthSquared,
  type Vector3,
  vectorNull
} from '@/schemas/vectors'
import { minMax } from '@/utils/min-max'

export interface ConfinedParticleProps {
  position: Vector3
  radius: number
  deltaY: number
}

// Represents a point that can move freely inside a cylinder, but not get out of it
export class ConfinedParticle {
  private position: Vector3

  // Center coordinates of the cylinder base
  private center: Vector3

  // Limits
  private radius: number
  private maxY: number
  private minY: number

  private forces: Vector3 = vectorNull()

  constructor({ position, radius, deltaY }: ConfinedParticleProps) {
    this.position = position
    this.center = position
    this.radius = radius
    this.maxY = position.y + deltaY
    this.minY = position.y - deltaY
  }

  public getPosition(): Vector3 {
    return this.position
  }

  public getCenter() {
    return this.center
  }

  public moveTo({ x, y, z }: Vector3) {
    const clampedY = minMax(y, this.minY, this.maxY)

    const baseY = this.center.y
    const contourLine = { x, y: baseY, z }

    const distanceFromCenter = distanceBetweenPoints(this.center, contourLine)

    let clampedX = x
    let clampedZ = z

    // If outside the cylinder radius, scale the position to the boundary
    if (distanceFromCenter > this.radius) {
      const scale = this.radius / distanceFromCenter
      clampedX = this.center.x + (x - this.center.x) * scale
      clampedZ = this.center.z + (z - this.center.z) * scale
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

  public computeAccumulatedForce(): number {
    const forceMagnitude = Math.sqrt(lengthSquared(this.forces))

    // Apply the accumulated forces
    this.moveBy(this.forces)

    // Reset forces after applying them
    this.forces = vectorNull()

    return forceMagnitude
  }
}
