import { api, params } from "@/services/httpClient"
import type { PageData } from "@/types/api"
import type { Poi } from "@/features/pois/types"
import type { Notice } from "../types"
export const accountApi = {
  favorites: (page: number, signal?: AbortSignal) =>
    api<PageData<Poi>>("/me/favorite-pois?" + params({ page, size: 10 }), {
      signal,
    }),
  notifications: (page: number, unread: boolean, signal?: AbortSignal) =>
    api<PageData<Notice>>(
      "/me/notifications?" + params({ page, size: 10, unread }),
      { signal }
    ),
  unread: (signal?: AbortSignal) =>
    api<number>("/me/notifications/unread-count", { signal }),
  favorite: (id: string, saved: boolean) =>
    api<void>("/me/favorite-pois/" + id, { method: saved ? "DELETE" : "PUT" }),
  write: (path: string, method: string) => api<void>(path, { method }),
}
