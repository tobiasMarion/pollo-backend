import type { Location } from '@/schemas/messages'

const EARTHS_RADIUS = 6371000 // Meters
const toRadians = (deg: number) => (deg * Math.PI) / 180

export function displacementOnEarth(
  pointLocation: Location,
  baseLocation: Location
) {
  const latStartRad = toRadians(baseLocation.latitude)
  const latEndRad = toRadians(pointLocation.latitude)
  const deltaLatRad = toRadians(pointLocation.latitude - baseLocation.latitude)
  const deltaLonRad = toRadians(
    pointLocation.longitude - baseLocation.longitude
  )

  // Approximate displacement on a local plane (valid for small distances)
  const deltaEast =
    EARTHS_RADIUS * deltaLonRad * Math.cos((latStartRad + latEndRad) / 2)
  const deltaNorth = EARTHS_RADIUS * deltaLatRad

  return { deltaEast, deltaNorth }
}
