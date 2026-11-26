import type { Bounds, SearchFilters } from "../types"
import type { Position } from "@/lib/map4d"
export function contains(bounds: Bounds, point: Position) {
  return (
    point.lat >= bounds.minLat &&
    point.lat <= bounds.maxLat &&
    point.lng >= bounds.minLng &&
    point.lng <= bounds.maxLng
  )
}
export function searchScope(
  filters: SearchFilters,
  bounds?: Bounds,
  position?: Position,
  radius = 2000
) {
  const clean = { ...filters }
  delete clean.lat
  delete clean.lng
  delete clean.radiusMeters
  if (clean.sort === "distance") delete clean.sort
  if (position && (!bounds || contains(bounds, position)))
    return {
      filters: {
        ...clean,
        lat: String(position.lat),
        lng: String(position.lng),
        radiusMeters: String(radius),
        sort: filters.sort || "distance",
      },
      bounds: undefined,
    }
  return { filters: clean, bounds }
}
export const recentKey = "ocop:recent-places:v1"
export interface RecentPlace {
  id: string
  name: string
}
export function readRecent(): RecentPlace[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(recentKey) || "[]")
    return Array.isArray(value)
      ? value
          .filter(
            (x): x is RecentPlace =>
              !!x && typeof x.id === "string" && typeof x.name === "string"
          )
          .slice(0, 10)
      : []
  } catch {
    return []
  }
}
export function rememberPlace(place: RecentPlace) {
  const next = [place, ...readRecent().filter((p) => p.id !== place.id)].slice(
    0,
    10
  )
  try {
    localStorage.setItem(recentKey, JSON.stringify(next))
  } catch {
    /* Private browsing can disable storage. */
  }
  return next
}
export function decodePolyline(encoded: string): Position[] {
  const path: Position[] = []
  let index = 0,
    lat = 0,
    lng = 0
  function value() {
    let result = 0,
      shift = 0,
      byte: number
    do {
      if (index >= encoded.length || shift > 30)
        throw new Error("Dữ liệu tuyến đường không hợp lệ")
      byte = encoded.charCodeAt(index++) - 63
      if (byte < 0 || byte > 63)
        throw new Error("Dữ liệu tuyến đường không hợp lệ")
      result |= (byte & 31) << shift
      shift += 5
    } while (byte >= 32)
    return result & 1 ? ~(result >> 1) : result >> 1
  }
  while (index < encoded.length) {
    lat += value()
    lng += value()
    path.push({ lat: lat / 1e5, lng: lng / 1e5 })
  }
  return path
}

export function routeCamera(
  path: Position[],
  width: number,
  height: number,
  inset?: number
) {
  const extent = path.reduce(
    (b, p) => ({
      minLat: Math.min(b.minLat, p.lat),
      maxLat: Math.max(b.maxLat, p.lat),
      minLng: Math.min(b.minLng, p.lng),
      maxLng: Math.max(b.maxLng, p.lng),
    }),
    { minLat: 90, maxLat: -90, minLng: 180, maxLng: -180 }
  )
  const panel = inset ?? (width > 700 ? 440 : 0)
  const availableWidth = Math.max(100, width - panel - 100),
    availableHeight = Math.max(100, height - (inset === 0 ? 360 : 100))
  const latitude = (extent.minLat + extent.maxLat) / 2
  const latRadians = (latitude * Math.PI) / 180
  const xSpan = (extent.maxLng - extent.minLng) / 360
  const ySpan =
    (extent.maxLat - extent.minLat) / 360 / Math.max(0.01, Math.cos(latRadians))
  const zoom = Math.min(
    16,
    Math.max(
      3,
      Math.floor(
        Math.log2(
          Math.min(
            availableWidth / Math.max(xSpan, 1e-8),
            availableHeight / Math.max(ySpan, 1e-8)
          ) / 256
        )
      )
    )
  )
  return {
    target: {
      lat:
        latitude -
        (inset === 0
          ? ((75 * 360) / (256 * 2 ** zoom)) * Math.cos(latRadians)
          : 0),
      lng:
        (extent.minLng + extent.maxLng) / 2 -
        ((panel / 2) * 360) / (256 * 2 ** zoom),
    },
    zoom,
  }
}
