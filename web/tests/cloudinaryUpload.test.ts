import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import {
  uploadCloudinary,
  validateUpload,
} from "../src/features/management/api/cloudinaryUpload"
import { managementApi } from "../src/features/management/api/managementApi"
vi.mock("../src/features/management/api/managementApi", () => ({
  managementApi: vi.fn(),
}))
const api = vi.mocked(managementApi)
beforeEach(() => {
  vi.resetAllMocks()
})
afterEach(() => {
  vi.unstubAllGlobals()
})
describe("Cloudinary upload", () => {
  it("rejects unsupported files, empty files and oversized images before requesting signatures", () => {
    expect(() =>
      validateUpload(
        new File(["x"], "icon.svg", { type: "image/svg+xml" }),
        true
      )
    ).toThrow("Chỉ hỗ trợ ảnh")
    expect(() =>
      validateUpload(new File([], "empty.png", { type: "image/png" }))
    ).toThrow("dung lượng")
    expect(() =>
      validateUpload(
        new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", {
          type: "image/png",
        })
      )
    ).toThrow("10 MB")
    expect(() =>
      validateUpload(new File(["x"], "clip.mp4", { type: "video/mp4" }), true)
    ).toThrow("Chỉ hỗ trợ ảnh")
    expect(
      validateUpload(new File(["x"], "clip.mp4", { type: "video/mp4" }))
    ).toBe("video")
  })
  it("uploads catalog icons without a business, sending no app credentials to Cloudinary", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetcher)
    api
      .mockResolvedValueOnce({
        id: "a",
        uploadUrl: "https://api.cloudinary.com/v1_1/test/image/upload",
        apiKey: "key",
        publicId: "ocop/catalog-icons/a",
        timestamp: 123,
        signature: "signed",
      })
      .mockResolvedValueOnce({
        id: "a",
        secureUrl: "https://res.cloudinary.com/test/a.png",
      })
    const result = await uploadCloudinary(
      new File(["x"], "icon.png", { type: "image/png" }),
      { catalog: true }
    )
    expect(api.mock.calls[0][0]).toBe(
      "/management/media/catalog-images/upload-signature"
    )
    const request = fetcher.mock.calls[0][1]
    expect(request.headers).toBeUndefined()
    expect(request.body.get("signature")).toBe("signed")
    expect(request.body.get("overwrite")).toBe("false")
    expect(api.mock.calls[1][1]?.body).toBe(
      JSON.stringify({ publicId: "ocop/catalog-icons/a" })
    )
    expect(result.secureUrl).toContain("res.cloudinary.com")
  })
  it("does not complete a failed Cloudinary upload", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    api.mockResolvedValueOnce({
      id: "a",
      uploadUrl: "https://api.cloudinary.com/test",
      apiKey: "key",
      publicId: "a",
      timestamp: 123,
      signature: "signed",
    })
    await expect(
      uploadCloudinary(new File(["x"], "photo.png", { type: "image/png" }), {
        businessId: "business",
      })
    ).rejects.toThrow("Không tải được")
    expect(api).toHaveBeenCalledTimes(1)
  })
})
