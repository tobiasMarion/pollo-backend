import { beforeEach, describe, expect, it } from 'vitest'

import { ConfinedParticle } from '.'

describe('ConfinedParticle', () => {
  let particle: ConfinedParticle

  beforeEach(() => {
    particle = new ConfinedParticle({
      position: { x: 0, y: 0, z: 100 },
      radius: 10,
      deltaZ: 5
    })
  })

  describe('constructor', () => {
    it('should initialize with the correct position and constraints', () => {
      const position = particle.getPosition()
      expect(position).toEqual({ x: 0, y: 0, z: 100 })
    })
  })

  describe('moveTo', () => {
    it('allows movement within the cylinder', () => {
      particle.moveTo({ x: 5, y: 5, z: 100 })
      expect(particle.getPosition()).toEqual({ x: 5, y: 5, z: 100 })
    })

    it('clamps vertical movement within bounds', () => {
      particle.moveTo({ x: 0, y: 0, z: 200 })
      expect(particle.getPosition().z).toBe(105)

      particle.moveTo({ x: 0, y: 0, z: -50 })
      expect(particle.getPosition().z).toBe(95)
    })

    it('constrains horizontal movement to the cylinder radius', () => {
      particle.moveTo({ x: 20, y: 0, z: 100 })
      expect(particle.getPosition().x).toBe(10)
      expect(particle.getPosition().y).toBe(0)

      particle.moveTo({ x: 10, y: 10, z: 100 })
      const pos = particle.getPosition()
      const dist = Math.hypot(pos.x, pos.y)
      expect(dist).toBeCloseTo(10, 1)
    })
  })

  describe('moveBy', () => {
    it('applies relative movement within constraints', () => {
      particle.moveBy({ x: 5, y: 3, z: 2 })
      expect(particle.getPosition()).toEqual({ x: 5, y: 3, z: 102 })
    })

    it('constrains relative movement to the cylinder', () => {
      particle.moveTo({ x: 10, y: 0, z: 100 })
      particle.moveBy({ x: 5, y: 0, z: 0 })
      expect(particle.getPosition()).toEqual({ x: 10, y: 0, z: 100 })
    })
  })

  describe('applyForce and computeAccumulatedForce', () => {
    it('accumulates and applies forces correctly', () => {
      particle.applyForce({ x: 1, y: 2, z: 3 })
      particle.applyForce({ x: 4, y: 5, z: 6 })
      const magnitude = particle.computeAccumulatedForce()
      expect(magnitude).toBeCloseTo(Math.sqrt(155), 2)
      expect(particle.getPosition()).toEqual({ x: 5, y: 7, z: 105 })
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
        deltaZ: 5
      })
      p.moveTo({ x: 100, y: 100, z: 4 })
      expect(p.getPosition()).toEqual({ x: 2, y: 3, z: 4 })
    })

    it('handles zero deltaZ (no vertical movement)', () => {
      const p = new ConfinedParticle({
        position: { x: 0, y: 0, z: 50 },
        radius: 10,
        deltaZ: 0
      })
      p.moveTo({ x: 0, y: 0, z: 100 })
      expect(p.getPosition().z).toBe(50)
    })

    it('returns zero magnitude and no movement when no forces', () => {
      const before = particle.getPosition()
      const magnitude = particle.computeAccumulatedForce()
      expect(magnitude).toBe(0)
      expect(particle.getPosition()).toEqual(before)
    })

    it('handles negative movement', () => {
      particle.moveBy({ x: -5, y: -5, z: -10 })
      expect(particle.getPosition()).toEqual({ x: -5, y: -5, z: 95 })
    })

    it('respects custom center offset for horizontal constraints', () => {
      const p = new ConfinedParticle({
        position: { x: 5, y: -5, z: 100 },
        radius: 10,
        deltaZ: 5
      })
      p.moveTo({ x: 30, y: -5, z: 100 })
      expect(p.getPosition().x).toBeCloseTo(15, 5)
      expect(p.getPosition().y).toBe(-5)
    })
  })
})
