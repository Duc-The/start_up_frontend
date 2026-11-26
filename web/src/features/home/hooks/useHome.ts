import { contains } from "../utils/searchScope"
import type { Position } from "@/lib/map4d"
import { homeApi } from "@/features/home/api/homeApi"
import { useQuery } from "@tanstack/react-query"
import { params } from "@/services/httpClient"
import type { SearchFilters, Bounds } from "@/features/home/types"

export function useHome(
  filters: SearchFilters,
  bounds: Bounds | undefined,
  userId?: string,
  position?: Position
) {
  const options = useQuery({
    queryKey: ["filters", "live"],
    queryFn: ({ signal }) => homeApi.filters(signal),
    staleTime: 300000,
  })
  const nearby =
    !!filters.keyword?.trim() &&
    !!position &&
    (!bounds || contains(bounds, position))
  const base = { ...filters }
  if (nearby) {
    base.lat = String(position.lat)
    base.lng = String(position.lng)
    base.radiusMeters = "2000"
    base.sort ||= "distance"
  }
  const probeQuery = params({
    ...base,
    ...(nearby ? {} : bounds),
    page: 0,
    size: 5,
  })
  const probe = useQuery({
    queryKey: ["search-radius", probeQuery],
    queryFn: ({ signal }) => homeApi.places(probeQuery, signal),
    enabled: nearby,
    staleTime: 30000,
  })
  const expanded = nearby && !!probe.data && probe.data.total < 5
  const radius = expanded ? 10000 : 2000
  if (nearby) base.radiusMeters = String(radius)
  const query = params({ ...base, ...(nearby ? {} : bounds), size: 20 })
  const places = useQuery({
    queryKey: ["pois", query, userId, "live"],
    queryFn: ({ signal }) => homeApi.places(query, signal),
    placeholderData: (previous, query) =>
      query?.queryKey[2] === userId && query?.queryKey[3] === "live"
        ? previous
        : undefined,
    staleTime: 30000,
    enabled: !nearby || !!probe.data,
  })
  const markers = useQuery({
    queryKey: ["markers", query, "live"],
    queryFn: ({ signal }) => homeApi.markers(query, signal),
    staleTime: 30000,
    enabled: !nearby || !!probe.data,
  })
  return {
    options,
    places,
    markers,
    searchRadius: nearby ? radius : undefined,
    scopeError: probe.error,
  }
}
