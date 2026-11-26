import { expect, it } from "vitest"
import { routeSummary } from "../src/features/directions/utils/routeSummary"
import type { Route } from "../src/features/directions/api/directionsApi"
it("hiển thị thời gian và quãng đường của tuyến đang chọn", () => {
  const route: Route = {
    overviewPolyline: "",
    summary: "Vòng Xuyên",
    distance: { text: "24.106km", value: 24106 },
    duration: { text: "27 phút 31 giây", value: 1651 },
    legs: [],
  }
  expect(routeSummary(route)).toEqual({
    duration: "27 phút 31 giây",
    distance: "24,1 km",
  })
})
it("cộng tất cả các chặng khi có điểm dừng và API không trả tổng", () => {
  const route: Route = {
    overviewPolyline: "",
    summary: "",
    legs: [
      {
        distance: { text: "", value: 1000 },
        duration: { text: "", value: 1800 },
        steps: [],
      },
      {
        distance: { text: "", value: 2000 },
        duration: { text: "", value: 2400 },
        steps: [],
      },
    ],
  }
  expect(routeSummary(route)).toEqual({
    duration: "1 giờ 10 phút",
    distance: "3 km",
  })
})
