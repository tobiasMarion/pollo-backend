import { describe, expect, it } from 'vitest'

import type { Location } from '@/schemas/location'

import { getDisplacementOnEarth, EARTHS_RADIUS, toRadians } from '.'

describe('getDisplacementOnEarth', () => {
  it('returns zero displacement when locations are identical', () => {
    const loc: Location = { latitude: 0, longitude: 0 }
    const { deltaEast, deltaNorth } = getDisplacementOnEarth(loc, loc)
    expect(deltaEast).toBeCloseTo(0, 10)
    expect(deltaNorth).toBeCloseTo(0, 10)
  })

  it('calculates northward displacement correctly', () => {
    const base: Location = { latitude: 0, longitude: 0 }
    const point: Location = { latitude: 1, longitude: 0 }
    const expectedNorth = EARTHS_RADIUS * toRadians(1)
    const { deltaEast, deltaNorth } = getDisplacementOnEarth(point, base)
    expect(deltaEast).toBeCloseTo(0, 6)
    expect(deltaNorth).toBeCloseTo(expectedNorth, 6)
  })

  it('calculates eastward displacement correctly at equator', () => {
    const base: Location = { latitude: 0, longitude: 0 }
    const point: Location = { latitude: 0, longitude: 1 }
    const expectedEast = EARTHS_RADIUS * toRadians(1) * Math.cos(toRadians(0))
    const { deltaEast, deltaNorth } = getDisplacementOnEarth(point, base)
    expect(deltaEast).toBeCloseTo(expectedEast, 6)
    expect(deltaNorth).toBeCloseTo(0, 6)
  })

  it('calculates displacement correctly at higher latitude', () => {
    const base: Location = { latitude: 45, longitude: 10 }
    const point: Location = { latitude: 46, longitude: 11 }
    const latStartRad = toRadians(base.latitude)
    const latEndRad = toRadians(point.latitude)
    const expectedNorth =
      EARTHS_RADIUS * toRadians(point.latitude - base.latitude)
    const expectedEast =
      EARTHS_RADIUS *
      toRadians(point.longitude - base.longitude) *
      Math.cos((latStartRad + latEndRad) / 2)
    const { deltaEast, deltaNorth } = getDisplacementOnEarth(point, base)
    expect(deltaNorth).toBeCloseTo(expectedNorth, 6)
    expect(deltaEast).toBeCloseTo(expectedEast, 6)
  })

  it('inverts sign when swapping point and base', () => {
    const base: Location = { latitude: 10, longitude: 20 }
    const point: Location = { latitude: 11, longitude: 21 }
    const forward = getDisplacementOnEarth(point, base)
    const backward = getDisplacementOnEarth(base, point)
    expect(backward.deltaNorth).toBeCloseTo(-forward.deltaNorth, 6)
    expect(backward.deltaEast).toBeCloseTo(-forward.deltaEast, 6)
  })
})
