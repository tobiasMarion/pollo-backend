import { randomUUID } from 'crypto'

type MessageType = 'USER_JOINED' | 'SET_STATUS'
type Message = { messageType: MessageType; value: string }

type EventState = 'OPEN' | 'ClOSED'

type SendMessage = (message: Message) => void

interface Subscriber {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number
  altitudeAccuracy: number
  sendMessage: SendMessage
}

interface Admin {
  userId: string
  sendMessage: SendMessage | undefined
}

export class EventPubSub {
  private admin: Admin
  private state: EventState = 'OPEN'
  private subscribers: Record<string, Subscriber> = {}
  private pixels: Subscriber[][] = []

  constructor({ adminId }: { adminId: string }) {
    this.admin = {
      userId: adminId,
      sendMessage: undefined
    }
  }

  public setAdminConnection(connection: (message: Message) => void) {
    this.admin.sendMessage = connection
  }

  public subscribe(subscriber: Subscriber): string {
    if (this.state !== 'ClOSED') {
      throw new Error(
        'You cannot subscribe to an Event that is already closed.'
      )
    }

    const subscriberId = randomUUID()
    this.subscribers[subscriberId] = subscriber

    if (this.admin.sendMessage) {
      this.admin.sendMessage({
        messageType: 'USER_JOINED',
        value: JSON.stringify({
          id: subscriberId,
          latitude: subscriber.latitude,
          longitude: subscriber.longitude,
          accuracy: subscriber.accuracy
        })
      })
    }

    return subscriberId
  }

  public publish(message: Message) {
    for (const subscriber of Object.values(this.subscribers)) {
      subscriber.sendMessage(message)
    }
  }
}
