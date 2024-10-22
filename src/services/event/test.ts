import { EventService } from '@/services/event/event'

const event = new EventService({ adminId: 'ADMIN_ID' })

for (let i = 0; i < 500; i++) {
  event.subscribe({
    accuracy: 0,
    altitude: 0,
    altitudeAccuracy: 0,
    latitude: Math.random() * 50,
    longitude: Math.random() * 50,
    sendMessage: console.log
  })
}

const start = new Date().getTime()

event.mapSubscribers()

const end = new Date().getTime()
console.log(end - start)
