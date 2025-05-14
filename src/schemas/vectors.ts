import { z } from 'zod'

export const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number()
})

export type Vector3 = z.infer<typeof vector3Schema>

/**
 * Returns a zero vector (0, 0, 0).
 * @returns A Vector3 with all components equal to zero.
 */
export const vectorNull = (): Vector3 => ({ x: 0, y: 0, z: 0 })

/**
 * Subtracts vector b from vector a (a - b).
 * @param a - The minuend vector.
 * @param b - The subtrahend vector.
 * @returns The result of a minus b.
 */
export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

/**
 * Computes the squared length (magnitude) of a vector.
 * Useful for performance when exact length is not required.
 * @param v - The vector to evaluate.
 * @returns The squared length (x^2 + y^2 + z^2).
 */
export function lengthSquared(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z
}

/**
 * Computes the Euclidean distance between two points.
 * @param p1 - The first point.
 * @param p2 - The second point.
 * @returns The distance between p1 and p2.
 */
export function distanceBetweenPoints(p1: Vector3, p2: Vector3): number {
  return Math.sqrt(lengthSquared(subtract(p1, p2)))
}

/**
 * Normalizes a vector to length 1.
 * If the vector has zero length, returns a zero vector.
 * @param v - The vector to normalize.
 * @returns A unit vector in the same direction as v, or zero vector.
 */
export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(lengthSquared(v))
  if (len === 0) return vectorNull()
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

/**
 * Scales a vector by a scalar factor.
 * @param v - The vector to scale.
 * @param scalar - The factor to multiply each component by.
 * @returns The scaled vector.
 */
export function scale(v: Vector3, scalar: number): Vector3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

/**
 * Adds two vectors component-wise.
 * @param a - The first vector.
 * @param b - The second vector.
 * @returns The sum of a and b.
 */
export function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

/**
 * Generates a random vector within a sphere of given maximum length.
 * Direction is uniformly random, length is uniformly random in [0, maxLength].
 * @param maxLength - The maximum length of the generated vector.
 * @returns A random Vector3 within the sphere.
 */
export function randomVector(maxLength: number): Vector3 {
  // Random direction
  const dir: Vector3 = normalize({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 2 - 1
  })
  // Random length
  const len = Math.random() * maxLength
  return scale(dir, len)
}
