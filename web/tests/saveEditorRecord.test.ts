import { beforeEach, describe, expect, it, vi } from "vitest"
import { saveEditorRecord } from "../src/features/management/api/saveEditorRecord"
import { managementApi } from "../src/features/management/api/managementApi"
import type { Row } from "../src/features/management/types"
vi.mock("../src/features/management/api/managementApi", () => ({
  managementApi: vi.fn(),
}))
const api = vi.mocked(managementApi)
beforeEach(() => vi.resetAllMocks())
describe("Saving management forms and media together", () => {
  it("attaches the selected image using the saved metadata version", async () => {
    const saved: Row = { id: "poi", version: 6 }
    const onSaved = vi.fn()
    api.mockResolvedValueOnce(saved).mockImplementationOnce(async () => {
      expect(onSaved).toHaveBeenCalledWith(saved)
      return null
    })
    await saveEditorRecord({
      section: "pois",
      record: { id: "poi", version: 5 },
      fields: { name: "Địa điểm" },
      mediaIds: ["image"],
      onSaved,
    })
    expect(api.mock.calls[0][0]).toBe("/management/pois/poi")
    expect(JSON.parse(String(api.mock.calls[0][1]?.body)).version).toBe(5)
    expect(api.mock.calls[1][0]).toBe("/management/pois/poi/media")
    expect(JSON.parse(String(api.mock.calls[1][1]?.body))).toEqual({
      version: 6,
      mediaIds: ["image"],
    })
  })
  it("keeps existing attachments when images were not changed", async () => {
    api.mockResolvedValueOnce({ id: "poi", version: 1 })
    await saveEditorRecord({
      section: "pois",
      record: { id: "poi" },
      fields: { name: "Địa điểm" },
      onSaved: vi.fn(),
    })
    expect(api).toHaveBeenCalledTimes(1)
  })
  it("sends an empty selection when the user removes all media", async () => {
    api
      .mockResolvedValueOnce({ id: "poi", version: 1 })
      .mockResolvedValueOnce(null)
    await saveEditorRecord({
      section: "pois",
      record: { id: "poi" },
      fields: { name: "Địa điểm" },
      mediaIds: [],
      onSaved: vi.fn(),
    })
    expect(JSON.parse(String(api.mock.calls[1][1]?.body)).mediaIds).toEqual([])
  })
  it("retains a created ID after media failure so retry cannot duplicate it", async () => {
    let record: Row = { id: "" }
    const onSaved = (saved: Row) => {
      record = saved
    }
    api
      .mockResolvedValueOnce({ id: "new-poi", version: 0 })
      .mockRejectedValueOnce(new Error("Tệp chưa sẵn sàng"))
    await expect(
      saveEditorRecord({
        section: "pois",
        record,
        fields: { name: "Địa điểm" },
        mediaIds: ["image"],
        onSaved,
      })
    ).rejects.toThrow("Thông tin đã được lưu, nhưng chưa lưu được ảnh/video")
    expect(record.id).toBe("new-poi")
    api
      .mockResolvedValueOnce({ id: "new-poi", version: 1 })
      .mockResolvedValueOnce(null)
    await saveEditorRecord({
      section: "pois",
      record,
      fields: { name: "Địa điểm" },
      mediaIds: ["image"],
      onSaved,
    })
    expect(api.mock.calls[0][1]?.method).toBe("POST")
    expect(api.mock.calls[2][0]).toBe("/management/pois/new-poi")
    expect(api.mock.calls[2][1]?.method).toBe("PUT")
  })
})
