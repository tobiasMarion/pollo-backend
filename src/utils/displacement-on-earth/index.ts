import type { Location } from '@/schemas/location'

export const EARTHS_RADIUS = 6371000

/**
 * Converts degrees to radians.
 * @param deg - Angle in degrees.
 * @returns Angle in radians.
 */
export const toRadians = (deg: number): number => (deg * Math.PI) / 180

/**
 * Computes the approximate displacement between two geographic points on Earth,
 * expressed as eastward and northward offsets on a local plane.
 * Suitable for relatively small distances where the Earth's curvature
 * can be approximated as flat.
 *
 * @param pointLocation - The target location with latitude and longitude.
 * @param baseLocation - The reference location with latitude and longitude.
 * @returns An object containing:
 *  - deltaEast: Eastward displacement in meters.
 *  - deltaNorth: Northward displacement in meters.
 */
export function displacementOnEarth(
  pointLocation: Location,
  baseLocation: Location
): { deltaEast: number; deltaNorth: number } {
  const latStartRad = toRadians(baseLocation.latitude)
  const latEndRad = toRadians(pointLocation.latitude)
  const deltaLatRad = toRadians(pointLocation.latitude - baseLocation.latitude)
  const deltaLonRad = toRadians(
    pointLocation.longitude - baseLocation.longitude
  )

  // Approximate displacement on a local tangent plane
  const deltaEast =
    EARTHS_RADIUS * deltaLonRad * Math.cos((latStartRad + latEndRad) / 2)
  const deltaNorth = EARTHS_RADIUS * deltaLatRad

  return { deltaEast, deltaNorth }
}
