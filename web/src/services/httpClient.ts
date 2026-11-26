import axios from "axios"
import { httpClient, refreshClient } from "@/lib/axios"
import {
  savedSession,
  saveSession,
  clearSession,
  getAccessToken,
} from "@/stores/authStore"
import type { ApiResponse } from "@/types/api"
import type { AuthResponse } from "@/features/auth/types"
export { savedSession, saveSession, clearSession } from "@/stores/authStore"
export { params } from "@/utils/queryParams"
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retried?: boolean
  }
}
export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}
function normalize(error: unknown): Error {
  if (error instanceof ApiError) return error
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    if (axios.isCancel(error)) return error
    return new ApiError(
      error.response?.status || 0,
      error.response?.data?.errors?.[0] ||
        error.response?.data?.message ||
        "Không thể kết nối với máy chủ. Vui lòng thử lại."
    )
  }
  return new ApiError(0, "Không thể xử lý yêu cầu. Vui lòng thử lại.")
}
let refreshTask: Promise<AuthResponse> | null = null
export function refreshSession(): Promise<AuthResponse> {
  if (refreshTask) return refreshTask
  const session = savedSession()
  if (!session)
    return Promise.reject(new ApiError(401, "Vui lòng đăng nhập để tiếp tục."))
  refreshTask = refreshClient
    .post<ApiResponse<AuthResponse>>("/auths/refresh", {
      refreshToken: session.refreshToken,
    })
    .then((response) => {
      if (savedSession()?.refreshToken !== session.refreshToken)
        throw new ApiError(401, "Phiên đăng nhập đã thay đổi")
      const auth = response.data.data
      if (!auth) throw new ApiError(401, "Dữ liệu phiên đăng nhập không hợp lệ")
      saveSession(auth)
      return auth
    })
    .catch((error) => {
      const normalized = normalize(error)
      if (
        normalized instanceof ApiError &&
        [401, 403].includes(normalized.status)
      )
        clearSession()
      throw normalized
    })
    .finally(() => {
      refreshTask = null
    })
  return refreshTask
}
httpClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (
    token &&
    !config.url?.startsWith("/auths/login") &&
    !config.url?.startsWith("/auths/register")
  )
    config.headers.set("Authorization", "Bearer " + token)
  return config
})
httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isAxiosError(error)) {
      const config = error.config
      const token = config?.headers.get("Authorization")
      if (
        error.response?.status === 401 &&
        config &&
        !config._retried &&
        token &&
        !config.url?.startsWith("/auths/")
      ) {
        config._retried = true
        if (token === "Bearer " + getAccessToken()) await refreshSession()
        return httpClient.request(config)
      }
    }
    throw normalize(error)
  }
)
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = Object.fromEntries(new Headers(init.headers).entries())
  if (init.body && !(init.body instanceof FormData))
    headers["Content-Type"] = "application/json"
  const response = await httpClient.request<ApiResponse<T>>({
    url: path,
    method: init.method || "GET",
    data: init.body,
    headers,
    signal: init.signal ?? undefined,
  })
  return response.data.data as T
}
export async function logout() {
  try {
    try {
      await api<void>("/auths/logout", { method: "POST" })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401 && savedSession()) {
        await refreshSession()
        await api<void>("/auths/logout", { method: "POST" })
      } else throw error
    }
  } finally {
    clearSession()
  }
}
