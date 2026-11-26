export interface Option {
  id: string
  name: string
  iconUrl?: string
  colorHex?: string
  parentId?: string
  children: Option[]
}

export interface Poi {
  id: string
  poiId: string
  name: string
  address: string
  area: Option
  imageUrl?: string
  categories: Option[]
  ratingAverage: number
  ratingCount: number
  distanceMeters?: number
  favorite: boolean
}

export interface Marker {
  id: string
  name: string
  lat: number
  lng: number
  categories: Option[]
}

export interface Media {
  id: string
  type: "IMAGE" | "VIDEO"
  url: string
  sortOrder: number
}

export interface Detail {
  poi: Poi
  lat?: number
  lng?: number
  openingHours: Record<string, { open: string; close: string }[]>
  media: Media[]
  activities: Option[]
  amenities: Option[]
}

export interface Product {
  id: string
  listingId: string
  name: string
  imageUrl?: string
  priceVnd: number
  stockQuantity: number
  certifications: {
    name: string
    type: string
    ocopStars?: number
    expiresOn: string
  }[]
}

export interface Review {
  id: string
  displayName: string
  avatarUrl?: string
  rating: number
  comment: string
  createdAt: string
  media: Media[]
}
