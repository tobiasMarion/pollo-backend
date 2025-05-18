import { beforeEach, describe, expect, it } from 'vitest'

import { distanceBetweenPoints } from '@/schemas/vectors'

import { ConfinedParticle } from '.'

describe('ConfinedParticle', () => {
  let particle: ConfinedParticle

  beforeEach(() => {
    particle = new ConfinedParticle({
      position: { x: 0, y: 0, z: 0 },
      radius: 10,
      deltaY: 5
    })
  })

  describe('constructor', () => {
    it('should initialize with the correct position and constraints', () => {
      const position = particle.getPosition()
      expect(position).toEqual({ x: 0, y: 0, z: 0 })
    })
  })

  describe('moveTo', () => {
    it('allows movement within the cylinder', () => {
      particle.moveTo({ x: 5, y: 100, z: 5 })
      expect(particle.getPosition()).toEqual({ x: 5, y: 5, z: 5 })
    })

    it('clamps vertical movement within bounds', () => {
      particle.moveTo({ x: 0, y: 200, z: 0 })
      expect(particle.getPosition().y).toBe(5)

      particle.moveTo({ x: 0, y: -100, z: 0 })
      expect(particle.getPosition().y).toBe(-5)
    })

    it('constrains horizontal movement to the cylinder radius', () => {
      particle.moveTo({ x: 20, y: 0, z: 0 })
      expect(particle.getPosition().x).toBe(10)
      expect(particle.getPosition().z).toBe(0)

      particle.moveTo({ x: 10, y: 0, z: 10 })
      const pos = particle.getPosition()

      const dist = distanceBetweenPoints(pos, particle.getCenter())
      expect(dist).toBeCloseTo(10, 1)
    })
  })

  describe('moveBy', () => {
    it('applies relative movement within constraints', () => {
      particle.moveBy({ x: 5, y: 3, z: 2 })
      expect(particle.getPosition()).toEqual({ x: 5, y: 3, z: 2 })
    })

    it('constrains relative movement to the cylinder', () => {
      particle.moveTo({ x: 10, y: 5, z: 0 })
      particle.moveBy({ x: 5, y: 0, z: 0 })
      expect(particle.getPosition()).toEqual({ x: 10, y: 5, z: 0 })
    })
  })

  describe('applyForce and computeAccumulatedForce', () => {
    it('accumulates and applies forces correctly', () => {
      particle.applyForce({ x: 1, y: 1, z: 1 })
      particle.applyForce({ x: 1, y: 1, z: 1 })
      particle.computeAccumulatedForce()
      expect(particle.getPosition()).toEqual({ x: 2, y: 2, z: 2 })
    })

    it('resets forces after computation', () => {
      particle.applyForce({ x: 1, y: 1, z: 1 })
      particle.computeAccumulatedForce()
      const posAfter = particle.getPosition()
      const magnitude = particle.computeAccumulatedForce()
      expect(magnitude).toBe(0)
      expect(particle.getPosition()).toEqual(posAfter)
    })
  })

  describe('edge cases', () => {
    it('handles zero radius (no horizontal movement)', () => {
      const p = new ConfinedParticle({
        position: { x: 2, y: 3, z: 4 },
        radius: 0,
        deltaY: 5
      })
      p.moveTo({ x: 100, y: 100, z: 100 })
      expect(p.getPosition()).toEqual({ x: 2, y: 8, z: 4 })
    })

    it('handles zero deltaZ (no vertical movement)', () => {
      const p = new ConfinedParticle({
        position: { x: 0, y: 0, z: 50 },
        radius: 10,
        deltaY: 0
      })
      p.moveTo({ x: 0, y: 100, z: 100 })
      expect(p.getPosition().z).toBe(60)
      expect(p.getPosition().y).toBe(0)
    })

    it('returns zero magnitude and no movement when no forces', () => {
      const before = particle.getPosition()
      const magnitude = particle.computeAccumulatedForce()
      expect(magnitude).toBe(0)
      expect(particle.getPosition()).toEqual(before)
    })

    it('handles negative movement', () => {
      particle.moveBy({ x: -5, y: -5, z: -5 })
      expect(particle.getPosition()).toEqual({ x: -5, y: -5, z: -5 })
    })

    it('respects custom center offset for horizontal constraints', () => {
      const p = new ConfinedParticle({
        position: { x: 5, y: -5, z: 5 },
        radius: 10,
        deltaY: 5
      })
      p.moveTo({ x: 15, y: -5, z: 5 })
      expect(p.getPosition().x).toBeCloseTo(15, 5)
      expect(p.getPosition().y).toBe(-5)
    })
  })
})
