import { describe, expect, it } from "vitest"
import {
  contains,
  searchScope,
  decodePolyline,
  routeCamera,
} from "../src/features/home/utils/searchScope"
const bounds = { minLat: 16, maxLat: 16.2, minLng: 108, maxLng: 108.3 }
describe("Phạm vi tìm kiếm", () => {
  it("tìm quanh GPS trong bản đồ và bỏ vùng giới hạn để bán kính không bị cắt", () => {
    expect(
      searchScope({ keyword: "coffee", page: "0" }, bounds, {
        lat: 16.1,
        lng: 108.2,
      })
    ).toEqual({
      filters: {
        keyword: "coffee",
        page: "0",
        lat: "16.1",
        lng: "108.2",
        radiusMeters: "2000",
        sort: "distance",
      },
      bounds: undefined,
    })
  })
  it("GPS ngoài bản đồ chỉ tìm trong viewport, loại bỏ bán kính và tọa độ cũ", () => {
    const result = searchScope(
      {
        keyword: "bánh canh",
        lat: "10",
        lng: "106",
        radiusMeters: "10000",
        sort: "distance",
      },
      bounds,
      { lat: 10, lng: 106 }
    )
    expect(result).toEqual({ filters: { keyword: "bánh canh" }, bounds })
  })
  it("chưa cấp GPS vẫn tìm trong vùng bản đồ", () =>
    expect(searchScope({ keyword: "OCOP" }, bounds)).toEqual({
      filters: { keyword: "OCOP" },
      bounds,
    }))
  it("coi vị trí ở mép bản đồ là nằm trong bản đồ", () =>
    expect(contains(bounds, { lat: 16, lng: 108 })).toBe(true))
})
describe("Giải mã lộ trình thực từ API", () => {
  it("giải mã tọa độ polyline chuẩn", () =>
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ]))
  it("từ chối polyline bị cắt", () =>
    expect(() => decodePolyline("_p~iF")).toThrow(
      "Dữ liệu tuyến đường không hợp lệ"
    ))
})

it("chọn camera bao quát tuyến xa thay vì cố định zoom", () => {
  const nearby = routeCamera(
    [
      { lat: 16, lng: 108 },
      { lat: 16.01, lng: 108.01 },
    ],
    1200,
    600
  )
  const distant = routeCamera(
    [
      { lat: 16, lng: 108 },
      { lat: 17, lng: 109 },
    ],
    1200,
    600
  )
  expect(distant.zoom).toBeLessThan(nearby.zoom)
  expect(distant.target.lat).toBe(16.5)
  expect(distant.target.lng).toBeLessThan(108.5)
})
