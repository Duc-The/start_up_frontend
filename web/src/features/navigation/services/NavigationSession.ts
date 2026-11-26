import type {
  Route,
  RouteLocation,
  TravelMode,
} from "@/features/directions/api/directionsApi"
import type { Position } from "@/lib/map4d"
import { decodePolyline } from "@/features/home/utils/searchScope"
import {
  metersBetween,
  projectProgress,
  remainingProgress,
  routeGeometry,
  type RouteGeometry,
} from "../utils/navigationProgress"
export interface GpsFix extends Position {
  accuracy: number
  heading: number | null
  timestamp: number
}
export interface NavigationState {
  status: "idle" | "preview" | "starting" | "navigating" | "arrived"
  route?: Route
  fix?: GpsFix
  error?: string
  warning?: string
  recalculating: boolean
  remainingMeters: number
  remainingSeconds: number
  nextInstruction: string
  nextMeters: number
}
const initial: NavigationState = {
  status: "idle",
  recalculating: false,
  remainingMeters: 0,
  remainingSeconds: 0,
  nextInstruction: "",
  nextMeters: 0,
}
type Router = (
  points: Position[],
  mode: TravelMode,
  signal: AbortSignal
) => Promise<{ routes: Route[] }>
export class NavigationSession {
  private snapshot: NavigationState = initial
  private listeners = new Set<() => void>()
  private watch?: number
  private freshness?: ReturnType<typeof setInterval>
  private generation = 0
  private controller?: AbortController
  private geometry?: RouteGeometry
  private along = 0
  private offRouteSince?: number
  private lastReroute = -Infinity
  private arrivalCount = 0
  private completedLegs = 0
  private pendingStops: RouteLocation[] = []
  private geolocation: () => Geolocation | undefined
  private router: Router
  private now: () => number
  constructor(
    geolocation: () => Geolocation | undefined,
    router: Router,
    now = () => Date.now()
  ) {
    this.geolocation = geolocation
    this.router = router
    this.now = now
  }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
  private update(patch: Partial<NavigationState>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach((fn) => fn())
  }
  private cleanup() {
    if (this.watch !== undefined) {
      this.geolocation()?.clearWatch(this.watch)
      this.watch = undefined
    }
    if (this.freshness) clearInterval(this.freshness)
    this.freshness = undefined
    this.controller?.abort()
    this.controller = undefined
  }
  stop = () => {
    this.generation++
    this.cleanup()
    this.geometry = undefined
    this.snapshot = { ...initial, fix: this.snapshot.fix }
    this.listeners.forEach((fn) => fn())
  }
  dispose = () => {
    this.stop()
    this.listeners.clear()
  }
  start = async (preview: Route) => {
    this.stop()
    const generation = this.generation
    if (!preview.destination) {
      this.update({ error: "Cần chọn điểm đến trước khi bắt đầu dẫn đường." })
      return
    }
    if (preview.origin && preview.origin.id !== "current-location") {
      try {
        const geometry = routeGeometry(decodePolyline(preview.overviewPolyline))
        if (geometry.path.length < 2 || geometry.length < 1)
          throw new Error("Dữ liệu tuyến đường chưa hợp lệ.")
        this.update({
          status: "preview",
          route: preview,
          fix: undefined,
          error: undefined,
          ...remainingProgress(preview, geometry, 0),
        })
      } catch {
        this.update({ error: "Chưa thể mở lộ trình. Hãy tìm đường lại." })
      }
      return
    }
    const geo = this.geolocation()
    if (!geo) {
      this.update({
        error: "Trình duyệt chưa hỗ trợ GPS. Hãy dùng thiết bị có định vị.",
      })
      return
    }
    this.update({ status: "starting", error: undefined })
    try {
      const gps = await new Promise<GeolocationPosition>((resolve, reject) =>
        geo.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        })
      )
      if (generation !== this.generation) return
      const fix = this.toFix(gps)
      if (!Number.isFinite(fix.accuracy) || fix.accuracy > 100)
        throw new Error(
          "GPS chưa đủ chính xác để bắt đầu. Hãy ra nơi thoáng và thử lại."
        )
      this.update({ fix })
      this.pendingStops = [...(preview.waypoints || [])]
      this.lastReroute = -Infinity
      this.arrivalCount = 0
      await this.calculate(fix, preview, generation)
      if (generation !== this.generation) return
      this.update({ status: "navigating" })
      this.watch = geo.watchPosition(
        (p) => {
          if (generation === this.generation) this.receive(p)
        },
        (e) => {
          if (generation !== this.generation) return
          if (e.code === 1) {
            this.stop()
            this.update({
              error: "Quyền định vị đã bị thu hồi. Dẫn đường đã dừng.",
            })
          } else
            this.update({
              warning: "Tạm mất tín hiệu GPS. Đang chờ vị trí mới…",
            })
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      )
      this.freshness = setInterval(() => {
        const latest = this.snapshot.fix
        if (
          this.snapshot.status === "navigating" &&
          latest &&
          this.now() - latest.timestamp > 20000
        )
          this.update({
            warning: "GPS chưa cập nhật. Không thể xác nhận vị trí hiện tại.",
          })
      }, 5000)
    } catch (error) {
      if (generation !== this.generation) return
      this.cleanup()
      const value = error as { code?: number; message?: string }
      this.update({
        status: "idle",
        error:
          value.code === 1
            ? "Bạn cần cho phép định vị để bắt đầu dẫn đường."
            : value.code === 3
              ? "Lấy GPS quá lâu. Hãy thử lại ở nơi thoáng."
              : value.code === 2
                ? "Chưa xác định được GPS. Hãy kiểm tra định vị và thử lại."
                : value.message || "Chưa thể bắt đầu dẫn đường. Hãy thử lại.",
      })
    }
  }
  startFromGps = (preview: Route) =>
    this.start({ ...preview, origin: undefined })
  private toFix(p: GeolocationPosition): GpsFix {
    return {
      lat: p.coords.latitude,
      lng: p.coords.longitude,
      accuracy: p.coords.accuracy,
      heading: p.coords.heading,
      timestamp: p.timestamp,
    }
  }
  private async calculate(fix: GpsFix, previous: Route, generation: number) {
    const target = previous.destination!,
      origin: RouteLocation = {
        id: "current-location",
        name: "Vị trí hiện tại",
        lat: fix.lat,
        lng: fix.lng,
      }
    const mode = previous.travelMode || "car"
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    const response = await this.router(
      [origin, ...this.pendingStops, target],
      mode,
      controller.signal
    )
    if (generation !== this.generation) return
    const first = response.routes[0]
    if (!first) throw new Error("Chưa tìm được tuyến từ vị trí GPS hiện tại.")
    const route = {
      ...first,
      travelMode: mode,
      origin,
      destination: target,
      waypoints: [...this.pendingStops],
    }
    const geometry = routeGeometry(decodePolyline(route.overviewPolyline))
    if (geometry.path.length < 2 || geometry.length < 1)
      throw new Error("Dữ liệu tuyến đường chưa hợp lệ để dẫn đường.")
    this.geometry = geometry
    this.along = 0
    this.completedLegs = 0
    this.offRouteSince = undefined
    this.update({
      route,
      recalculating: false,
      warning: undefined,
      ...remainingProgress(route, geometry, 0),
    })
  }
  private receive(p: GeolocationPosition) {
    const route = this.snapshot.route,
      geometry = this.geometry
    if (!route || !geometry || this.snapshot.status !== "navigating") return
    const fix = this.toFix(p)
    if (this.snapshot.fix && fix.timestamp <= this.snapshot.fix.timestamp)
      return
    if (this.now() - fix.timestamp > 15000) return
    if (!Number.isFinite(fix.accuracy) || fix.accuracy > 80) {
      this.arrivalCount = 0
      this.update({
        warning: "GPS có độ chính xác thấp. Đang chờ tín hiệu tốt hơn…",
      })
      return
    }
    const previousFix = this.snapshot.fix
    const budget =
      (previousFix ? metersBetween(previousFix, fix) * 2 : 0) +
      Math.max(35, fix.accuracy)
    this.update({ fix, warning: undefined })
    const projection = projectProgress(
      fix,
      geometry,
      this.along,
      this.along + budget
    )
    if (projection.distance <= Math.max(35, fix.accuracy)) {
      this.along = Math.max(this.along, projection.along)
      this.offRouteSince = undefined
      const progress = remainingProgress(route, geometry, this.along)
      if (progress.leg > this.completedLegs) {
        this.pendingStops = this.pendingStops.slice(
          progress.leg - this.completedLegs
        )
        this.completedLegs = progress.leg
      }
      this.update(progress)
      const near =
        fix.accuracy <= 35 &&
        progress.remainingMeters < 80 &&
        metersBetween(fix, route.destination!) <= 30
      this.arrivalCount = near ? this.arrivalCount + 1 : 0
      if (this.arrivalCount >= 2) {
        this.cleanup()
        this.update({
          status: "arrived",
          remainingMeters: 0,
          remainingSeconds: 0,
          nextInstruction: "Bạn đã đến điểm đến",
          nextMeters: 0,
        })
      }
    } else {
      this.arrivalCount = 0
      if (projection.distance > Math.max(60, fix.accuracy * 1.5)) {
        this.offRouteSince ??= this.now()
        if (
          this.now() - this.offRouteSince >= 8000 &&
          this.now() - this.lastReroute >= 20000 &&
          !this.snapshot.recalculating
        ) {
          this.lastReroute = this.now()
          this.update({
            recalculating: true,
            warning: "Bạn đang ngoài tuyến. Đang tìm lại đường…",
          })
          const generation = this.generation
          void this.calculate(fix, route, generation).catch(() => {
            if (generation === this.generation)
              this.update({
                recalculating: false,
                warning:
                  "Chưa tìm lại được đường. Kiểm tra kết nối và vị trí GPS.",
              })
          })
        }
      }
    }
  }
}
