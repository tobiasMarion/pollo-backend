interface Location {
  latitude: number
  longitude: number
  horizontalAccuracy: number
  altitude: number
  verticalAccuracy: number
}

interface AuthMessage {
  type: 'AUTHENTICATION'
  token: string
}

interface UserJoinedMessage {
  type: 'USER_JOINED'
  subscriberId: string
  deviceId: string
  location: Location
}

interface UserLeftMessage {
  type: 'USER_LEFT'
  subscriberId: string
  deviceId: string
}

interface Effect {
  type: 'EFFECT'
}

type Message = UserJoinedMessage | AuthMessage | UserLeftMessage | Effect

type SendMessage = (message: Message) => void

interface Subscriber {
  deviceId: string
  location: Location
  sendMessage: SendMessage
}

interface Admin {
  userId: string
  sendMessage: SendMessage | undefined
}
