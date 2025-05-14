import { minMax } from '@/utils/min-max'
import { add, lengthSquared, type Vector3, vectorNull } from '@/schemas/vectors'

export interface ConfinedParticleProps {
  position: Vector3
  radius: number
  deltaZ: number
}

// Represents a point that can move freely inside a cylinder, but not get out of it
export class ConfinedParticle {
  private position: Vector3

  // Center coordinates of the cylinder base
  private centerX: number
  private centerY: number
  private radius: number

  private maxZ: number
  private minZ: number

  private forces: Vector3 = vectorNull()

  constructor({ position, radius, deltaZ }: ConfinedParticleProps) {
    this.position = position
    this.centerX = position.x
    this.centerY = position.y
    this.radius = radius
    this.maxZ = position.z + deltaZ
    this.minZ = position.z - deltaZ
  }

  public getPosition(): Vector3 {
    return this.position
  }

  public moveTo({ x, y, z }: Vector3) {
    const clampedZ = minMax(z, this.minZ, this.maxZ)

    // Calculate distance from center of the cylinder
    const dx = x - this.centerX
    const dy = y - this.centerY
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy)

    let clampedX = x
    let clampedY = y

    // If outside the cylinder radius, scale the position to the boundary
    if (distanceFromCenter > this.radius) {
      const scale = this.radius / distanceFromCenter
      // Apply scaling relative to center
      clampedX = this.centerX + dx * scale
      clampedY = this.centerY + dy * scale
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
