import type { Vector3 } from './vectors'

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
function randomTruncatedNormal(
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

/**
 * Returns a Gaussian noise vector (not clamped) based on the provided options.
 * @throws if min >= max
 */
export function generateCustomGaussianNoise(
  options: GaussianNoiseOptions
): Vector3 {
  const { min, max, center = (min + max) / 2, spreadFraction = 1 / 3 } = options
  if (min >= max)
    throw new Error('generateCustomGaussianNoise: min must be < max')
  if (spreadFraction <= 0 || spreadFraction > 1) {
    console.warn(
      'generateCustomGaussianNoise: spreadFraction should be in (0,1], defaulting to 1/3'
    )
  }

  const range = max - min
  const stdDev = range * spreadFraction

  return {
    x: randomNormal(center, stdDev),
    y: randomNormal(center, stdDev),
    z: randomNormal(center, stdDev)
  }
}

/**
 * Returns a clamped Gaussian noise vector within [min, max] based on the provided options.
 * @throws if min >= max
 */
export function generateClampedGaussianNoise(
  options: GaussianNoiseOptions
): Vector3 {
  const { min, max, center = (min + max) / 2, spreadFraction = 1 / 3 } = options
  if (min >= max)
    throw new Error('generateClampedGaussianNoise: min must be < max')
  if (spreadFraction <= 0 || spreadFraction > 1) {
    console.warn(
      'generateClampedGaussianNoise: spreadFraction should be in (0,1], defaulting to 1/3'
    )
  }

  const range = max - min
  const stdDev = range * spreadFraction

  return {
    x: randomTruncatedNormal(center, stdDev, min, max),
    y: randomTruncatedNormal(center, stdDev, min, max),
    z: randomTruncatedNormal(center, stdDev, min, max)
  }
}
