import { store } from "@/stores"
import { setManagementSection, setSidebarOpen } from "@/stores/uiSlice"
import type { AuthResponse, User } from "@/features/auth/types"
const SESSION = "ocop.auth"
let accessToken: string | null = null
type SavedSession = { refreshToken: string; user: User }
export function savedSession(): SavedSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION) || "null")
  } catch {
    return null
  }
}
export function saveSession(auth: AuthResponse) {
  accessToken = auth.accessToken
  sessionStorage.setItem(
    SESSION,
    JSON.stringify({ refreshToken: auth.refreshToken, user: auth.user })
  )
  window.dispatchEvent(new Event("ocop:auth"))
}
export function clearSession() {
  store.dispatch(setManagementSection("dashboard"))
  store.dispatch(setSidebarOpen(false))
  accessToken = null
  sessionStorage.removeItem(SESSION)
  window.dispatchEvent(new Event("ocop:auth"))
}

export function getAccessToken() {
  return accessToken
}
