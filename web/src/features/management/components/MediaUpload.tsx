import SearchableSelect from "@/components/common/SearchableSelect"
import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Images, LoaderCircle } from "lucide-react"
import { toast } from "sonner"
import { managementApi } from "../api/managementApi"
import {
  uploadCloudinary,
  IMAGE_ACCEPT,
  MEDIA_ACCEPT,
} from "../api/cloudinaryUpload"
import type { PageData } from "@/types/api"
import type { Choice, Row } from "../types"
import { base } from "../config/managementConfig"

export default function MediaUpload({
  onDone,
  businessId,
  imagesOnly = false,
  onUploaded,
  onBusyChange,
  disabled = false,
}: {
  disabled?: boolean
  onDone?: () => unknown
  businessId?: string
  imagesOnly?: boolean
  onUploaded?: (asset: Row) => void
  onBusyChange?: (busy: boolean) => void
}) {
  const [business, setBusiness] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const queryClient = useQueryClient()
  const owner = businessId || business
  const companies = useQuery({
    queryKey: ["management", "business-options"],
    queryFn: () =>
      managementApi<PageData<Choice>>(base + "businesses?size=100"),
    enabled: !businessId,
  })
  async function upload(file: File) {
    if (busy || disabled) return
    setBusy(true)
    onBusyChange?.(true)
    setError("")
    try {
      const asset = await uploadCloudinary(file, {
        businessId: owner,
        imagesOnly,
      })
      onUploaded?.(asset)
      await queryClient.invalidateQueries({
        queryKey: ["management", "attach-options", owner],
      })
      toast.success(
        onUploaded
          ? "Đã tải ảnh lên. Bấm Lưu thay đổi để lưu vào nội dung."
          : "Đã tải tài nguyên lên"
      )
      onDone?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được tệp.")
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }
  return (
    <div className="mg-upload" aria-busy={busy}>
      <Images size={26} />
      <div>
        <strong>{imagesOnly ? "Thêm ảnh" : "Thêm ảnh hoặc video"}</strong>
        <p>Ảnh tối đa 10 MB{!imagesOnly && " · Video tối đa 200 MB"}</p>
      </div>
      {!businessId && (
        <SearchableSelect
          className="mg-upload-select"
          label="Cơ sở sở hữu tài nguyên"
          placeholder="Chọn cơ sở…"
          value={business}
          onChange={setBusiness}
          disabled={busy || disabled}
          loading={companies.isPending}
          options={(companies.data?.items || []).map((c) => ({
            value: c.id,
            label: c.name,
          }))}
        />
      )}
      <label className="mg-upload-pick">
        {busy ? (
          <LoaderCircle size={16} className="mg-spin" />
        ) : (
          <Images size={16} />
        )}
        {busy ? "Đang tải lên…" : "Chọn tệp"}
        <input
          className="mg-file-input"
          aria-label={imagesOnly ? "Tải ảnh lên" : "Tải ảnh hoặc video lên"}
          disabled={!owner || busy || disabled}
          type="file"
          accept={imagesOnly ? IMAGE_ACCEPT : MEDIA_ACCEPT}
          onChange={(e) => {
            const f = e.target.files?.[0]
            e.target.value = ""
            if (f) void upload(f)
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mg-error">
          {error}
        </p>
      )}
    </div>
  )
}
