import { afterEach, describe, expect, it, vi } from "vitest"
import type { Route } from "../src/features/directions/api/directionsApi"
import { NavigationSession } from "../src/features/navigation/services/NavigationSession"
import {
  metersBetween,
  projectProgress,
  remainingProgress,
  routeGeometry,
} from "../src/features/navigation/utils/navigationProgress"
const route: Route = {
  overviewPolyline: "??gE?gE?",
  summary: "Đường thử",
  travelMode: "foot",
  origin: { id: "current-location", name: "Vị trí hiện tại", lat: 1, lng: 1 },
  destination: { id: "target", name: "Điểm đến", lat: 0.002, lng: 0 },
  distance: { text: "222 m", value: 222 },
  duration: { text: "3 phút", value: 180 },
  legs: [
    {
      distance: { text: "222 m", value: 222 },
      duration: { text: "3 phút", value: 180 },
      steps: [
        {
          htmlInstructions: "Đi thẳng",
          streetName: "",
          distance: { text: "111 m", value: 111 },
        },
        {
          htmlInstructions: "Rẽ trái",
          streetName: "",
          distance: { text: "111 m", value: 111 },
        },
      ],
    },
  ],
}
const sessions: NavigationSession[] = []
afterEach(() => {
  sessions.splice(0).forEach((s) => s.dispose())
})
function fixture() {
  let now = 100000,
    watch: PositionCallback | undefined,
    watchError: PositionErrorCallback | undefined
  function position(lat = 0, lng = 0, accuracy = 5): GeolocationPosition {
    return {
      coords: {
        latitude: lat,
        longitude: lng,
        accuracy,
        heading: null,
        speed: null,
        altitude: null,
        altitudeAccuracy: null,
      },
      timestamp: now,
    } as GeolocationPosition
  }
  const geo = {
    getCurrentPosition: vi.fn((success: PositionCallback) =>
      success(position())
    ),
    watchPosition: vi.fn(
      (success: PositionCallback, error: PositionErrorCallback) => {
        watch = success
        watchError = error
        return 0
      }
    ),
    clearWatch: vi.fn(),
  } as unknown as Geolocation
  const router = vi.fn(async () => ({ routes: [route] }))
  const session = new NavigationSession(
    () => geo,
    router,
    () => now
  )
  sessions.push(session)
  return {
    session,
    geo,
    router,
    emit: (lat: number, lng = 0, accuracy = 5, advance = 1000) => {
      now += advance
      watch?.(position(lat, lng, accuracy))
    },
    error: (code: number) =>
      watchError?.({
        code,
        message: "provider text",
      } as GeolocationPositionError),
  }
}
describe("Dẫn đường với GPS", () => {
  it("lấy GPS thật làm điểm đi khi bắt đầu và yêu cầu GPS độ chính xác cao", async () => {
    const f = fixture()
    await f.session.start(route)
    expect(f.session.getSnapshot().status).toBe("navigating")
    expect(f.router.mock.calls[0][0][0]).toMatchObject({ lat: 0, lng: 0 })
    expect(f.geo.watchPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      expect.objectContaining({ enableHighAccuracy: true, maximumAge: 0 })
    )
    expect(f.session.getSnapshot().route?.origin?.name).toBe("Vị trí hiện tại")
  })
  it("cập nhật vị trí, giảm quãng đường và thời gian còn lại, giữ tiến độ khi GPS rung", async () => {
    const f = fixture()
    await f.session.start(route)
    f.emit(0.0008)
    const before = f.session.getSnapshot()
    expect(before.fix?.lat).toBe(0.0008)
    expect(before.remainingMeters).toBeLessThan(222)
    expect(before.remainingSeconds).toBeLessThan(180)
    f.emit(0.00075)
    expect(f.session.getSnapshot().remainingMeters).toBeCloseTo(
      before.remainingMeters
    )
  })
  it("không dùng GPS thiếu chính xác để báo đã đến nơi", async () => {
    const f = fixture()
    await f.session.start(route)
    f.emit(0.002, 0, 200)
    f.emit(0.002, 0, 200)
    expect(f.session.getSnapshot().status).toBe("navigating")
    expect(f.session.getSnapshot().fix?.lat).toBe(0)
    expect(f.session.getSnapshot().warning).toContain("độ chính xác thấp")
  })
  it("xác nhận đến nơi qua hai lần GPS và tự dừng theo dõi", async () => {
    const f = fixture()
    await f.session.start(route)
    f.emit(0.00195)
    expect(f.session.getSnapshot().status).toBe("navigating")
    f.emit(0.00198)
    expect(f.session.getSnapshot().status).toBe("arrived")
    expect(f.session.getSnapshot().remainingMeters).toBe(0)
    expect(f.geo.clearWatch).toHaveBeenCalledWith(0)
  })
  it("nút dừng hủy watcher và bỏ qua callback GPS cũ", async () => {
    const f = fixture()
    await f.session.start(route)
    f.session.stop()
    const state = f.session.getSnapshot()
    f.emit(0.001)
    expect(f.geo.clearWatch).toHaveBeenCalledWith(0)
    expect(f.session.getSnapshot()).toBe(state)
  })
  it("thu hồi quyền GPS sẽ dừng dẫn đường", async () => {
    const f = fixture()
    await f.session.start(route)
    f.error(1)
    expect(f.session.getSnapshot().status).toBe("idle")
    expect(f.session.getSnapshot().error).toContain("thu hồi")
    expect(f.geo.clearWatch).toHaveBeenCalledWith(0)
  })
  it("chỉ tìm lại đường sau khi lệch tuyến đủ lâu, có thời gian chờ giữa các lần gọi", async () => {
    const f = fixture()
    await f.session.start(route)
    f.emit(0.0005, 0.002)
    expect(f.router).toHaveBeenCalledTimes(1)
    f.emit(0.0005, 0.002, 5, 9000)
    await Promise.resolve()
    await Promise.resolve()
    expect(f.router).toHaveBeenCalledTimes(2)
    f.emit(0.0005, 0.002, 5, 1000)
    f.emit(0.0005, 0.002, 5, 9000)
    expect(f.router).toHaveBeenCalledTimes(2)
  })
  it("không khởi động lại khi phản hồi tìm đường về sau lúc đã bấm dừng", async () => {
    let resolve!: (v: { routes: Route[] }) => void
    const f = fixture()
    f.router.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r
        })
    )
    const task = f.session.start(route)
    await Promise.resolve()
    f.session.stop()
    resolve({ routes: [route] })
    await task
    expect(f.session.getSnapshot().status).toBe("idle")
    expect(f.geo.watchPosition).not.toHaveBeenCalled()
  })
  it("từ chối bắt đầu khi chưa cấp quyền, không gọi tìm đường", async () => {
    const f = fixture()
    vi.mocked(f.geo.getCurrentPosition).mockImplementation((_success, error) =>
      error?.({ code: 1 } as GeolocationPositionError)
    )
    await f.session.start(route)
    expect(f.session.getSnapshot().error).toContain("cho phép định vị")
    expect(f.router).not.toHaveBeenCalled()
  })
})
describe("Tiến độ trên tuyến", () => {
  const geometry = routeGeometry([
    { lat: 0, lng: 0 },
    { lat: 0.001, lng: 0 },
    { lat: 0.002, lng: 0 },
  ])
  it("tính khoảng cách và chiếu vị trí lên đoạn tuyến", () => {
    expect(
      metersBetween({ lat: 0, lng: 0 }, { lat: 0.001, lng: 0 })
    ).toBeCloseTo(111.195, 1)
    const p = projectProgress({ lat: 0.0005, lng: 0.0001 }, geometry)
    expect(p.along).toBeCloseTo(55.6, 0)
    expect(p.distance).toBeCloseTo(11.1, 0)
  })
  it("chọn hướng dẫn đoạn tiếp theo dựa trên tiến độ", () => {
    const p = remainingProgress(route, geometry, geometry.length * 0.6)
    expect(p.nextInstruction).toBe("Rẽ trái")
    expect(p.remainingMeters).toBeCloseTo(88.8, 1)
  })
})

it("không nhảy tới cuối tuyến vòng khi GPS gần một đoạn đường giao nhau", () => {
  const geometry = routeGeometry([
    { lat: 0, lng: 0 },
    { lat: 0.01, lng: 0 },
    { lat: 0.01, lng: 0.01 },
    { lat: 0, lng: 0.01 },
    { lat: 0, lng: 0 },
  ])
  const progress = projectProgress(
    { lat: 0.000001, lng: 0.0001 },
    geometry,
    0,
    35
  )
  expect(progress.along).toBeLessThan(35)
})

it("chọn điểm đi cụ thể thì giữ nguyên tọa độ và không yêu cầu hoặc theo dõi GPS", async () => {
  const f = fixture()
  const selected = {
    ...route,
    origin: { id: "poi-manual", name: "Địa điểm đã chọn", lat: 0.001, lng: 0 },
  }
  await f.session.start(selected)
  expect(f.session.getSnapshot().status).toBe("preview")
  expect(f.session.getSnapshot().route?.origin).toEqual(selected.origin)
  expect(f.session.getSnapshot().fix).toBeUndefined()
  expect(f.geo.getCurrentPosition).not.toHaveBeenCalled()
  expect(f.geo.watchPosition).not.toHaveBeenCalled()
  expect(f.router).not.toHaveBeenCalled()
})
it("chỉ hỏi GPS sau khi người dùng chủ động chọn vị trí của tôi", async () => {
  const f = fixture()
  const selected = {
    ...route,
    origin: { id: "poi-manual", name: "Địa điểm đã chọn", lat: 0.001, lng: 0 },
  }
  await f.session.start(selected)
  expect(f.geo.getCurrentPosition).not.toHaveBeenCalled()
  await f.session.startFromGps(selected)
  expect(f.geo.getCurrentPosition).toHaveBeenCalledTimes(1)
  expect(f.session.getSnapshot().status).toBe("navigating")
  expect(f.session.getSnapshot().route?.origin?.id).toBe("current-location")
})
