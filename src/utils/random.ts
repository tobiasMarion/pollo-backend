export function randIntBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export interface GaussianNoiseOptions {
  min: number
  max: number
  center?: number
  spreadFraction?: number // fraction of (max - min), e.g. 1/3
}

/**
 * Generates a normally distributed number with given mean and standard deviation.
 * @throws if stdDev < 0
 */
export function randomNormal(mean: number, stdDev: number): number {
  if (stdDev < 0) throw new Error('randomNormal: stdDev must be >= 0')
  let u = 0
  let v = 0

  // Avoid zero to prevent log(0)
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return (
    mean + Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev
  )
}

/**
 * Generates a truncated normal number within [min, max].
 * Falls back to clamping after max attempts to avoid infinite loops.
 * @throws if stdDev < 0 or min >= max
 */
export function randomTruncatedNormal(
  mean: number,
  stdDev: number,
  min: number,
  max: number
): number {
  if (stdDev < 0) throw new Error('randomTruncatedNormal: stdDev must be >= 0')
  if (min >= max) throw new Error('randomTruncatedNormal: min must be < max')

  let value: number
  let attempts = 0
  const MAX_ATTEMPTS = 10

  do {
    let u = 0
    let v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    value =
      mean +
      Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev

    attempts++
    if (attempts > MAX_ATTEMPTS) {
      // Fallback: clamp to avoid infinite loop
      return Math.min(max, Math.max(min, value))
    }
  } while (value < min || value > max)

  return value
}
