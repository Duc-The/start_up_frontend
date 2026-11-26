import { managementApi } from "./managementApi"
import type { Row } from "../types"

export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/avif,image/gif"
export const MEDIA_ACCEPT =
  IMAGE_ACCEPT + ",video/mp4,video/quicktime,video/webm"
const imageTypes = IMAGE_ACCEPT.split(",")
const videoTypes = ["video/mp4", "video/quicktime", "video/webm"]
export function validateUpload(
  file: File,
  imagesOnly = false
): "image" | "video" {
  const type = imageTypes.includes(file.type)
    ? "image"
    : videoTypes.includes(file.type) && !imagesOnly
      ? "video"
      : null
  if (!type)
    throw new Error(
      imagesOnly
        ? "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, AVIF hoặc GIF."
        : "Chỉ hỗ trợ ảnh JPG, PNG, WEBP, AVIF, GIF và video MP4, MOV, WEBM."
    )
  const limit = type === "image" ? 10 : 200
  if (!file.size || file.size > limit * 1024 * 1024)
    throw new Error(
      `Tệp phải có dung lượng lớn hơn 0 và không quá ${limit} MB.`
    )
  return type
}
interface Ticket {
  id: string
  uploadUrl: string
  apiKey: string
  publicId: string
  timestamp: number
  signature: string
}
export async function uploadCloudinary(
  file: File,
  options: { businessId?: string; catalog?: boolean; imagesOnly?: boolean }
): Promise<Row> {
  const type = validateUpload(file, options.catalog || options.imagesOnly)
  if (!options.catalog && !options.businessId)
    throw new Error("Vui lòng chọn cơ sở sở hữu tài nguyên.")
  const root = "/management/media"
  const ticket = await managementApi<Ticket>(
    root +
      (options.catalog
        ? "/catalog-images/upload-signature"
        : "/upload-signature"),
    {
      method: "POST",
      ...(options.catalog
        ? {}
        : {
            body: JSON.stringify({
              businessId: options.businessId,
              resourceType: type,
              altText: file.name,
            }),
          }),
    }
  )
  const form = new FormData()
  Object.entries({
    file,
    api_key: ticket.apiKey,
    public_id: ticket.publicId,
    timestamp: String(ticket.timestamp),
    signature: ticket.signature,
    overwrite: "false",
  }).forEach(([key, value]) => form.append(key, value))
  // Cloudinary receives only the signed upload parameters, never our bearer token.
  let response: Response
  try {
    response = await fetch(ticket.uploadUrl, { method: "POST", body: form })
  } catch {
    throw new Error(
      "Không kết nối được Cloudinary. Vui lòng kiểm tra mạng và thử lại."
    )
  }
  if (!response.ok)
    throw new Error("Không tải được tệp lên Cloudinary. Vui lòng thử lại.")
  return managementApi<Row>(
    root +
      (options.catalog ? "/catalog-images/complete" : `/${ticket.id}/complete`),
    {
      method: "POST",
      ...(options.catalog
        ? { body: JSON.stringify({ publicId: ticket.publicId }) }
        : {}),
    }
  )
}
