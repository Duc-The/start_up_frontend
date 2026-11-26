import { managementApi } from "./managementApi"
import { base } from "../config/managementConfig"
import type { Row } from "../types"

export async function saveEditorRecord({
  section,
  record,
  fields,
  mediaIds,
  onSaved,
}: {
  section: string
  record: Row
  fields: Record<string, unknown>
  mediaIds?: string[]
  onSaved: (saved: Row) => void
}): Promise<Row> {
  const saved = await managementApi<Row>(
    base + section + (record.id ? "/" + record.id : ""),
    {
      method: record.id ? "PUT" : "POST",
      body: JSON.stringify({
        ...fields,
        version: record.version ?? fields.version,
      }),
    }
  )
  // Keep the new ID/version if uploading the attachments fails, so retry cannot duplicate a new record.
  onSaved(saved)
  if (mediaIds !== undefined) {
    try {
      await managementApi(base + section + "/" + saved.id + "/media", {
        method: "PUT",
        body: JSON.stringify({ version: saved.version, mediaIds }),
      })
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Vui lòng thử lại."
      throw new Error(
        "Thông tin đã được lưu, nhưng chưa lưu được ảnh/video. Các ảnh bạn chọn vẫn được giữ trong popup. " +
          reason,
        { cause: error }
      )
    }
  }
  return saved
}
