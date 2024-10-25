interface AuthMessage {
  type: 'AUTHENTICATION'
  token: string
}

interface UserJoinedMessage {
  type: 'USER_JOINED'
  id: string
  latitude: number
  longitude: number
  accuracy: number
}

interface UserLeftMessage {
  type: 'USER_LEFT'
  id: string
}

type Message = UserJoinedMessage | AuthMessage | UserLeftMessage
type SendMessage = (message: string) => void

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
