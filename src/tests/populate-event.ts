import readline from 'readline'
import WebSocket from 'ws'

import { env } from '@/lib/env'
import { type Event } from '@/schemas/event'
import type { Location } from '@/schemas/location'
import type { MessageTypes } from '@/schemas/messages'
import { EARTHS_RADIUS } from '@/utils/displacement-on-earth'
import { randomNormal } from '@/utils/random'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question: string): Promise<string> {
  return new Promise(resolve => rl.question(question, ans => resolve(ans)))
}

function meterOffset(lat: number, meters: number): { dLat: number; dLon: number } {
  const dLat = (meters / EARTHS_RADIUS) * (180 / Math.PI)
  const dLon = (meters / (EARTHS_RADIUS * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI)
  return { dLat, dLon }
}

function generateLocations(base: Event, count: number, maxRadius: number = 15): Location[] {
  const arr: Location[] = []
  for (let i = 0; i < count; i++) {
    const r = Math.random() * maxRadius
    const theta = Math.random() * 2 * Math.PI
    const { dLat } = meterOffset(base.latitude, r * Math.cos(theta))
    const { dLon } = meterOffset(base.latitude, r * Math.sin(theta))
    const altitudeVariation = randomNormal(2, 1) // Variação vertical com desvio padrão de 1 metro
    arr.push({
      latitude: base.latitude + dLat,
      longitude: base.longitude + dLon,
      altitude: altitudeVariation,
      horizontalAccuracy: 0,
      verticalAccuracy: 0
    })
  }
  return arr
}

function applyGaussianError(location: Location, latStdDev: number, lonStdDev: number, altStdDev: number): Location {
  const latError = randomNormal(0, latStdDev)
  const lonError = randomNormal(0, lonStdDev)
  const altError = randomNormal(0, altStdDev)
  const { dLat } = meterOffset(location.latitude, latError)
  const { dLon } = meterOffset(location.latitude, lonError)
  return {
    latitude: location.latitude + dLat,
    longitude: location.longitude + dLon,
    altitude: location.altitude + altError,
    horizontalAccuracy: Math.sqrt(latError ** 2 + lonError ** 2),
    verticalAccuracy: Math.abs(altError)
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function main() {
  try {
    const eventId = await askQuestion('Event ID: ')
    const countStr = await askQuestion('Amount of Connections: ')
    const connectionCount = parseInt(countStr, 10)

    console.log(`Fetching event ${eventId}...`)
    const res = await fetch(`http://localhost:${env.PORT}/events/${eventId}`)
    if (!res.ok) {
      throw new Error(`Error fetching event: ${res.status} ${res.statusText}`)
    }
    const { event }: { event: Event } = await res.json()

    console.log('Generating points...')
    const realLocations = generateLocations(event, connectionCount)

    console.log(`Opening ${connectionCount} WebSocket connections (100ms interval) and sending JOIN message...`)
    const sockets: WebSocket[] = []
    const deviceIds: string[] = []

    for (let i = 0; i < connectionCount; i++) {
      if (i > 0) {
        await delay(100)
      }

      const ws = new WebSocket(`ws://localhost:${env.PORT}/events/${eventId}/join`)
      sockets.push(ws)

      ws.on('open', () => {
        const deviceId = `device-${i + 1}-${Date.now()}`
        deviceIds[i] = deviceId

        const noisyLocation = applyGaussianError(realLocations[i], 1, 5, 3)

        const joinMsg: MessageTypes['JOIN'] = {
          type: 'JOIN',
          deviceId,
          location: noisyLocation
        }
        ws.send(JSON.stringify(joinMsg))

        scheduleDistanceReports(i, ws, realLocations, deviceIds)
      })
    }

    console.log('Press Ctrl+C to close.')
  } catch (err) {
    console.error('Error:', (err as Error).message)
    rl.close()
  }
}

function scheduleDistanceReports(
  i: number,
  ws: WebSocket,
  locations: Location[],
  deviceIds: string[],
  intervalMs: number = 5000,
  maxDistance: number = 6
) {
  setInterval(() => {
    let j = Math.floor(Math.random() * locations.length)
    while (j === i) {
      j = Math.floor(Math.random() * locations.length)
    }

    const locA = locations[i]
    const locB = locations[j]
    const toRad = (v: number) => (v * Math.PI) / 180
    const deltaLat = toRad(locB.latitude - locA.latitude)
    const deltaLong = toRad(locB.longitude - locA.longitude)
    const a =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(toRad(locA.latitude)) * Math.cos(toRad(locB.latitude)) * Math.sin(deltaLong / 2) ** 2
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const dist = EARTHS_RADIUS * c

    if (dist <= maxDistance) {
      const error = Math.random() * 1 - 0.5 // ±0.5m
      const measured = dist + error

      const msg: MessageTypes['DISTANCE'] = {
        type: 'DISTANCE',
        to: deviceIds[j],
        distance: measured % 1 > 0.5 ? measured : null
      }
      ws.send(JSON.stringify(msg))
    }
  }, intervalMs)
}

main()
