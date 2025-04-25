export type Vector3 = { x: number; y: number; z: number }
export const vectorNull = (): Vector3 => ({ x: 0, y: 0, z: 0 })

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function lengthSquared(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z
}

export function distanceBetweenPoints(p1: Vector3, p2: Vector3) {
  return Math.sqrt(lengthSquared(subtract(p1, p2)))
}

export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(lengthSquared(v))
  if (len === 0) return vectorNull()
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

export function scale(v: Vector3, scalar: number): Vector3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

export function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z }
}

export function randomVector(maxLength: number): Vector3 {
  const direction = normalize({
    x: Math.random() * 2 - 1,
    y: Math.random() * 2 - 1,
    z: Math.random() * 2 - 1
  })

  const length = Math.random() * maxLength

  return scale(direction, length)
}
