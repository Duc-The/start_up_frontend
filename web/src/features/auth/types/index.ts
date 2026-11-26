export interface User {
  id: string
  userId: string
  email: string
  displayName: string
  avatarUrl?: string
  status: string
  roles: string[]
}

export interface AuthResponse {
  user: User
  tokenType: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}
