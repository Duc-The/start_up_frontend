import { api } from "@/services/httpClient"
export function managementApi<T>(path: string, options: RequestInit = {}) {
  return api<T>(path, options)
}
