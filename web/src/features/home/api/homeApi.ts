import { api, params } from "@/services/httpClient"
import type { Filters, Suggestion } from "../types"
import type { Poi, Marker } from "@/features/pois/types"
import type { PageData } from "@/types/api"
export const homeApi = {
  filters: (signal?: AbortSignal) => api<Filters>("/home/filters", { signal }),
  places: (query: string, signal?: AbortSignal) =>
    api<PageData<Poi>>("/pois?" + query, { signal }),
  markers: (query: string, signal?: AbortSignal) =>
    api<PageData<Marker>>("/pois/map?" + query, { signal }),
  suggestions: (keyword: string, signal?: AbortSignal) =>
    api<Suggestion[]>("/search/suggestions?" + params({ keyword, limit: 6 }), {
      signal,
    }),
}
