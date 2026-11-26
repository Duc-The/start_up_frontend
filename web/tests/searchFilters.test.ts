import { afterEach, describe, expect, it, vi } from "vitest"
import { readFilters } from "../src/features/home/utils/searchFilters"
afterEach(() => vi.unstubAllGlobals())
describe("Home URL filters", () => {
  it("discards legacy preview filters before querying live UUID-based endpoints", () => {
    vi.stubGlobal("window", {
      location: {
        search:
          "?demo=1&areaIds=haichau&productTypeIds=food&activityIds=shop&page=9",
      },
    })
    expect(readFilters()).toEqual({})
  })
  it("preserves real filters and pagination", () => {
    const id = "cebb4899-dcc5-471c-ad4f-e48154146bc2"
    vi.stubGlobal("window", {
      location: {
        search: `?areaIds=${id}&keyword=Nam+%C3%94&page=2&sort=rating`,
      },
    })
    expect(readFilters()).toEqual({
      areaIds: [id],
      keyword: "Nam Ô",
      page: "2",
      sort: "rating",
    })
  })
})
