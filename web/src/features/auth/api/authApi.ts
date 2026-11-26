import { api, logout } from "@/services/httpClient"
import type { AuthResponse } from "../types"
export const authApi = {
  login: (request: { email: string; password: string }) =>
    api<AuthResponse>("/auths/login", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  register: (request: Record<string, FormDataEntryValue>) =>
    api<void>("/auths/register", {
      method: "POST",
      body: JSON.stringify(request),
    }),
  logout,
}
