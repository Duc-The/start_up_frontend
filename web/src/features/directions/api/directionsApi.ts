import { api } from "@/services/httpClient"
import type { Position } from "@/lib/map4d"
export interface Measure {
  text: string
  value: number
}
export type TravelMode = "car" | "motorcycle" | "foot"
export interface RouteLocation extends Position {
  id: string
  name: string
}
export const travelModeLabels: Record<TravelMode, string> = {
  car: "Ô tô",
  motorcycle: "Xe máy",
  foot: "Đi bộ",
}
export interface Route {
  travelMode?: TravelMode
  origin?: RouteLocation
  destination?: RouteLocation
  waypoints?: RouteLocation[]
  overviewPolyline: string
  summary: string
  distance?: Measure
  duration?: Measure
  legs: {
    distance: Measure
    duration: Measure
    steps: { htmlInstructions: string; streetName: string; distance: Measure }[]
  }[]
}
export const directionsApi = (
  points: Position[],
  mode: string,
  signal?: AbortSignal
) =>
  api<{ routes: Route[] }>("/pois/directions", {
    method: "POST",
    body: JSON.stringify({
      points: points.map(({ lat, lng }) => ({ lat, lng })),
      mode,
    }),
    signal,
  })
