import { Event } from '@prisma/client'
import { randomUUID } from 'crypto'
import readLine from 'readline'
import { WebSocket } from 'ws'

import { env } from '@/lib/env'

const AMOUNT_OF_USERS = 700
const BASE_URL = `http://localhost:${env.PORT}`

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getEvent<T>(id: string) {
  const response = await fetch(`${BASE_URL}/events/${id}`)

  if (!response.ok) {
    throw new Error(response.statusText)
  }

  return (await response.json()) as T
}

function getValueAround(n: number, maxDistance: number) {
  const sign = Math.pow(-1, Math.round(Math.random()))
  const distance = sign * maxDistance * Math.random()
  return n + distance
}

async function joinEventAround(id: string, origin: { x: number; y: number }) {
  const ws = new WebSocket(`${BASE_URL}/events/${id}/join`)

  ws.onopen = () => {
    const message = JSON.stringify({
      type: 'JOIN',
      deviceId: randomUUID(),
      location: {
        longitude: getValueAround(origin.x, 0.003),
        latitude: getValueAround(origin.y, 0.003),
        horizontalAccuracy: 1,
        altitude: 1,
        verticalAccuracy: 1
      }
    })

    ws.send(message)
  }
}

const rl = readLine.createInterface({
  input: process.stdin,
  output: process.stdout
})

console.log('=-=-= POPULATE EVENT =-=-=')

rl.question(`Event Id: `, async id => {
  const { event } = await getEvent<{ event: Event }>(id)

  for (let index = 0; index < AMOUNT_OF_USERS; index++) {
    await delay(2)
    joinEventAround(event.id, { x: event.longitude, y: event.latitude })
  }

  console.log(`${AMOUNT_OF_USERS} joined ${event.name} Event`)

  rl.close()
})
