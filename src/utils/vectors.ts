export type Vector3 = { x: number; y: number; z: number }

export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
}

export function lengthSquared(v: Vector3): number {
  return v.x * v.x + v.y * v.y + v.z * v.z
}

export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(lengthSquared(v))
  if (len === 0) return { x: 0, y: 0, z: 0 }
  return { x: v.x / len, y: v.y / len, z: v.z / len }
}

export function scale(v: Vector3, scalar: number): Vector3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar }
}

export function add(a: Vector3, b: Vector3): Vector3 {
  a.x += b.x
  a.y += b.y
  a.z += b.z

  return a
}
