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

type Message =
  | UserJoinedMessage
  | AuthMessage
  | UserLeftMessage
  | UserMatrixPosition

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
