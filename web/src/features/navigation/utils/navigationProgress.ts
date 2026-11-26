import type { Position } from "@/lib/map4d"
import type { Route } from "@/features/directions/api/directionsApi"
const earth = 6371000
export function metersBetween(a: Position, b: Position) {
  const rad = Math.PI / 180,
    lat = (b.lat - a.lat) * rad,
    lng = (b.lng - a.lng) * rad
  const h =
    Math.sin(lat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(lng / 2) ** 2
  return 2 * earth * Math.asin(Math.sqrt(Math.min(1, h)))
}
export function routeGeometry(path: Position[]) {
  const cumulative = [0]
  for (let i = 1; i < path.length; i++)
    cumulative.push(cumulative[i - 1] + metersBetween(path[i - 1], path[i]))
  return { path, cumulative, length: cumulative[cumulative.length - 1] || 0 }
}
export type RouteGeometry = ReturnType<typeof routeGeometry>
export function projectProgress(
  point: Position,
  geometry: RouteGeometry,
  previous = 0,
  maximumAlong = Infinity
) {
  let best = { distance: Infinity, along: previous }
  const scale = (earth * Math.PI) / 180,
    cos = Math.cos((point.lat * Math.PI) / 180)
  for (let i = 1; i < geometry.path.length; i++) {
    if (
      geometry.cumulative[i] < previous - 40 ||
      geometry.cumulative[i - 1] > maximumAlong
    )
      continue
    const a = geometry.path[i - 1],
      b = geometry.path[i]
    const ax = (a.lng - point.lng) * scale * cos,
      ay = (a.lat - point.lat) * scale
    const bx = (b.lng - point.lng) * scale * cos,
      by = (b.lat - point.lat) * scale
    const dx = bx - ax,
      dy = by - ay,
      len = dx * dx + dy * dy
    const segmentLength = geometry.cumulative[i] - geometry.cumulative[i - 1]
    const lower = segmentLength
      ? Math.max(
          0,
          (previous - 40 - geometry.cumulative[i - 1]) / segmentLength
        )
      : 0
    const upper = segmentLength
      ? Math.min(1, (maximumAlong - geometry.cumulative[i - 1]) / segmentLength)
      : 1
    const t = len
      ? Math.max(lower, Math.min(upper, -(ax * dx + ay * dy) / len))
      : 0
    const distance = Math.hypot(ax + t * dx, ay + t * dy)
    const along =
      geometry.cumulative[i - 1] +
      t * (geometry.cumulative[i] - geometry.cumulative[i - 1])
    if (distance < best.distance) best = { distance, along }
  }
  return best
}
export function remainingProgress(
  route: Route,
  geometry: RouteGeometry,
  along: number
) {
  const totalMeters =
    route.distance?.value ||
    route.legs.reduce((s, l) => s + l.distance.value, 0) ||
    geometry.length
  const totalSeconds =
    route.duration?.value ||
    route.legs.reduce((s, l) => s + l.duration.value, 0)
  const fraction = geometry.length
    ? Math.min(1, Math.max(0, along / geometry.length))
    : 0
  const travelled = totalMeters * fraction
  let end = 0,
    leg = 0,
    nextInstruction = "Tiếp tục theo tuyến đường",
    nextMeters = 0
  let selected = false
  for (let i = 0; i < route.legs.length; i++) {
    const current = route.legs[i]
    const legStart = end
    for (const step of current.steps || []) {
      end += step.distance?.value || 0
      if (!selected && end > travelled) {
        nextInstruction = (
          step.htmlInstructions ||
          step.streetName ||
          nextInstruction
        ).replace(/<[^>]*>/g, " ")
        nextMeters = Math.max(0, end - travelled)
        selected = true
      }
    }
    end = Math.max(end, legStart + current.distance.value)
    if (travelled >= end - 15 && i < route.legs.length - 1) leg = i + 1
  }
  return {
    remainingMeters: Math.max(0, totalMeters - travelled),
    remainingSeconds: Math.max(0, totalSeconds * (1 - fraction)),
    nextInstruction,
    nextMeters,
    leg,
  }
}
export function readableDistance(meters: number) {
  return meters >= 1000
    ? `${(meters / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} km`
    : `${Math.round(meters)} m`
}
export function readableDuration(seconds: number) {
  const m = Math.max(1, Math.ceil(seconds / 60))
  return m >= 60 ? `${Math.floor(m / 60)} giờ ${m % 60} phút` : `${m} phút`
}
