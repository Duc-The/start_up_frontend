import { useEffect, useState } from "react"
import { clearSession, savedSession, getAccessToken } from "@/stores/authStore"
import { refreshSession } from "@/services/httpClient"
import type { User } from "../types"
export function useAuth() {
  const [user, setUser] = useState<User | null>(() =>
    getAccessToken() ? savedSession()?.user || null : null
  )
  useEffect(() => {
    const update = () =>
      setUser(getAccessToken() ? savedSession()?.user || null : null)
    window.addEventListener("ocop:auth", update)
    update()
    if (savedSession() && !getAccessToken())
      void refreshSession().catch(() => {
        clearSession()
      })
    return () => window.removeEventListener("ocop:auth", update)
  }, [])
  return user
}
