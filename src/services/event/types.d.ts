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

interface UserMatrixPosition {
  type: 'USER_MATRIX_POSITION'
  id: string
  row: number
  column: number
}

interface Effect {
  type: 'EFFECT'
}

type Message =
  | UserJoinedMessage
  | AuthMessage
  | UserLeftMessage
  | UserMatrixPosition
  | Effect

type SendMessage = (message: Message) => void

interface User {
  latitude: number
  longitude: number
  accuracy: number
  altitude: number
  altitudeAccuracy: number
  sendMessage: (string: string) => void
}

interface Subscriber extends User {
  sendMessage: SendMessage
}

interface Admin {
  userId: string
  sendMessage: SendMessage | undefined
}
