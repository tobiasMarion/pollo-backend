type MessageType = 'USER_JOINED' | 'SET_STATUS'
export type Message = { messageType: MessageType; value: string }

type EventState = 'OPEN' | 'ClOSED'

interface Subscriber {
  latitude: number
  longitude: number
  sendMessage: (message: Message) => void
}

export class EventPubSub {
  private admin: Subscriber | undefined
  private state: EventState = 'OPEN'
  private subscribers: Subscriber[] = []
  private pixels: Subscriber[][] = []

  public setAdmin(admin: Subscriber) {
    this.admin = admin
  }

  public subscribe(subscriber: Subscriber) {
    if (this.state !== 'ClOSED') {
      throw new Error(
        'You cannot subscribe to an Event that is already closed.'
      )
    }

    this.subscribers.push(subscriber)

    this.admin?.sendMessage({
      messageType: 'USER_JOINED',
      value: JSON.stringify({
        latitude: subscriber.latitude,
        longitude: subscriber.longitude
      })
    })
  }

  public publish(message: Message) {
    this.subscribers.forEach(({ sendMessage }) => sendMessage(message))
  }
}
