import type { Bounds } from "@/features/home/types"
export interface Position {
  lat: number
  lng: number
}
export interface MapInstance {
  panTo(position: Position): void
  moveCamera(position: { target?: Position; zoom?: number }): void
  getCamera(): { zoom: number }
  getBounds(): { getNortheast(): Position; getSouthwest(): Position }
  addListener(
    event: string,
    callback: (event?: { marker?: MarkerInstance }) => void,
    options?: { marker?: boolean }
  ): { remove(): void }
  enable3dMode(enabled: boolean): void
  is3dMode(): boolean
  destroy?: () => void
}
export interface MarkerInstance {
  setMap(map: MapInstance | null): void
  setUserData(value: string): void
  getUserData(): string
}
export interface PolylineInstance {
  setMap(map: MapInstance | null): void
}
export interface MapSdk {
  Polyline: new (options: Record<string, unknown>) => PolylineInstance
  Map: new (
    element: HTMLElement,
    options: Record<string, unknown>
  ) => MapInstance
  Marker: new (options: Record<string, unknown>) => MarkerInstance
}
declare global {
  interface Window {
    map4d?: MapSdk
    ocopMapReady?: () => void
  }
}
let loading: Promise<MapSdk> | undefined
export function loadMap(): Promise<MapSdk> {
  if (window.map4d) return Promise.resolve(window.map4d)
  if (loading) return loading
  loading = new Promise((resolve, reject) => {
    const key =
      import.meta.env.VITE_MAP4D_MAP_KEY || import.meta.env.VITE_MAP4D_WEB_KEY
    if (!key) {
      reject(new Error("Chưa cấu hình Map4D Web SDK key."))
      return
    }
    const script = document.createElement("script")
    const timer = setTimeout(() => fail(), 30000)
    const fail = () => {
      clearTimeout(timer)
      script.remove()
      loading = undefined
      reject(
        new Error(
          "Không tải được bản đồ. Kiểm tra kết nối hoặc quyền truy cập của Map4D key."
        )
      )
    }
    window.ocopMapReady = () => {
      clearTimeout(timer)
      if (window.map4d) resolve(window.map4d)
      else fail()
    }
    script.src =
      "https://api.map4d.vn/sdk/map/js?version=2.4&key=" +
      encodeURIComponent(key) +
      "&callback=ocopMapReady"
    script.async = true
    script.onerror = fail
    document.head.appendChild(script)
  })
  return loading
}
export function mapBounds(map: MapInstance): Bounds {
  const bounds = map.getBounds(),
    ne = bounds.getNortheast(),
    sw = bounds.getSouthwest()
  return {
    minLat: +sw.lat.toFixed(5),
    maxLat: +ne.lat.toFixed(5),
    minLng: +sw.lng.toFixed(5),
    maxLng: +ne.lng.toFixed(5),
  }
}
