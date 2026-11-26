import type { Group, SearchFilters } from "@/features/home/types"
export const groups: Group[] = [
  "areaIds",
  "productTypeIds",
  "categoryIds",
  "activityIds",
  "amenityIds",
  "ocopStars",
]
export function readFilters(): SearchFilters {
  const url = new URLSearchParams(window.location.search)
  // Old preview URLs contain non-UUID sample filters; reset them before calling the API.
  if (url.get("demo") === "1") return {}
  const values: SearchFilters = {}
  groups.forEach((key) => {
    const value = url.get(key)
    if (value) values[key] = value.split(",")
  })
  ;["keyword", "lat", "lng", "radiusMeters", "sort", "page"].forEach((key) => {
    const v = url.get(key)
    if (v) (values as Record<string, unknown>)[key] = v
  })
  return values
}
