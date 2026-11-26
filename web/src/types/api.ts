export interface ApiResponse<T> {
  status: number
  message: string
  data?: T
  errorCode?: string
  errors?: string[]
  path: string
}

export interface PageData<T> {
  items: T[]
  total: number
  page: number
  size: number
}
