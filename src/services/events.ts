type MessageType = 'USER_JOINED' | 'SET_STATUS'
export type Message = { messageType: MessageType; value: string }

type EventState = 'OPEN' | 'ClOSED'

type SendMessage = (message: Message) => void

interface Subscriber {
  latitude: number
  longitude: number
  sendMessage: SendMessage
}

interface Admin {
  userId: string
  sendMessage: SendMessage | undefined
}

export class EventPubSub {
  private admin: Admin
  private state: EventState = 'OPEN'
  private subscribers: Subscriber[] = []
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

  public subscribe(subscriber: Subscriber) {
    if (this.state !== 'ClOSED') {
      throw new Error(
        'You cannot subscribe to an Event that is already closed.'
      )
    }

    this.subscribers.push(subscriber)

    if (this.admin.sendMessage) {
      this.admin.sendMessage({
        messageType: 'USER_JOINED',
        value: JSON.stringify({
          latitude: subscriber.latitude,
          longitude: subscriber.longitude
        })
      })
    }
  }

  public publish(message: Message) {
    this.subscribers.forEach(({ sendMessage }) => sendMessage(message))
  }
}
