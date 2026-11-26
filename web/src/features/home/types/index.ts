import type { Option } from "@/features/pois/types"
export interface Filters {
  areas: Option[]
  productTypes: Option[]
  categories: Option[]
  activities: Option[]
  amenities: Option[]
  ocopStars: number[]
}

export type Group =
  | "areaIds"
  | "productTypeIds"
  | "categoryIds"
  | "activityIds"
  | "amenityIds"
  | "ocopStars"

export type SearchFilters = Partial<Record<Group, string[]>> & {
  keyword?: string
  lat?: string
  lng?: string
  radiusMeters?: string
  sort?: string
  page?: string
}

export interface Bounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface Suggestion {
  id: string
  type: "POI" | "PRODUCT"
  name: string
}
