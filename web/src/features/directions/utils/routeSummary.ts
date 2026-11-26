import type { Route } from "../api/directionsApi"
export function routeSummary(route: Route) {
  const seconds =
    route.duration?.value ||
    route.legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0)
  const meters =
    route.distance?.value ||
    route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0)
  const minutes = Math.max(1, Math.ceil(seconds / 60))
  const duration =
    route.duration?.text ||
    (minutes >= 60
      ? `${Math.floor(minutes / 60)} giờ${minutes % 60 ? ` ${minutes % 60} phút` : ""}`
      : `${minutes} phút`)
  const number = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 })
  return {
    duration,
    distance:
      meters >= 1000
        ? `${number.format(meters / 1000)} km`
        : `${Math.round(meters)} m`,
  }
}
