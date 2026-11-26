import { ArrowLeft, ImagePlus, Trash2, Star } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import MediaUpload from "./MediaUpload"
import SearchableSelect from "@/components/common/SearchableSelect"
import { managementApi } from "../api/managementApi"
import { base } from "../config/managementConfig"
import { params } from "@/services/httpClient"
import type { PageData } from "@/types/api"
import type { Row } from "../types"
import type { useEditorMedia } from "../hooks/useEditorMedia"

export default function Attachments({
  section,
  media,
  disabled,
  onBusyChange,
}: {
  section: string
  media: ReturnType<typeof useEditorMedia>
  disabled: boolean
  onBusyChange: (busy: boolean) => void
}) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const assets = useQuery({
    queryKey: ["management", "attach-options", media.businessId],
    queryFn: () =>
      managementApi<PageData<Row>>(
        base + "media?" + params({ businessId: media.businessId, size: 100 })
      ),
    enabled: !!media.businessId,
  })
  const all = [
    ...new Map(
      [
        ...(media.attached.data || []),
        ...(assets.data?.items || []),
        ...media.uploaded,
      ].map((a) => [a.id, a])
    ).values(),
  ]
  const selected = media.ids
    .map((id) => all.find((a) => a.id === id))
    .filter((a): a is Row => !!a)
  function cover(id: string) {
    media.change([id, ...media.ids.filter((value) => value !== id)])
  }
  return (
    <fieldset className="mg-attachments">
      <legend>Ảnh / video</legend>
      <p className="mg-upload-hint">
        Chọn ảnh, đặt ảnh đại diện rồi bấm <strong>Lưu thay đổi</strong> ở cuối
        popup để lưu tất cả.
      </p>
      {media.loading ? (
        <p role="status">Đang tải ảnh hiện tại…</p>
      ) : media.error ? (
        <p className="mg-error" role="alert">
          Không tải được ảnh hiện tại.{" "}
          <button type="button" onClick={() => void media.attached.refetch()}>
            Thử lại
          </button>
        </p>
      ) : (
        <>
          {media.businessId ? (
            <MediaUpload
              businessId={media.businessId}
              imagesOnly={section === "products"}
              onUploaded={media.add}
              onBusyChange={onBusyChange}
              disabled={disabled || media.ids.length >= 50}
            />
          ) : (
            <p className="mg-upload-hint">
              {section === "businesses"
                ? "Lưu cơ sở trước để tạo thư viện ảnh riêng cho cơ sở này."
                : "Chọn cơ sở sở hữu hoặc địa điểm/sản phẩm liên quan trước khi tải ảnh."}
            </p>
          )}
          {ownerError(media.owner.error)}
          {selected.length > 0 && (
            <div className="mg-attachment-grid">
              {selected.map((asset, index) => (
                <article className="mg-attachment-card" key={asset.id}>
                  <a
                    className="mg-attachment-preview"
                    href={String(asset.secureUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {asset.resourceType === "image" ? (
                      <img
                        src={String(asset.secureUrl)}
                        alt={String(asset.altText || "Ảnh đã chọn")}
                        loading="lazy"
                      />
                    ) : (
                      <video
                        src={String(asset.secureUrl)}
                        controls
                        preload="metadata"
                      />
                    )}
                    {index === 0 && asset.resourceType === "image" && (
                      <span>Ảnh đại diện</span>
                    )}
                  </a>
                  <div className="mg-attachment-actions">
                    {asset.resourceType === "image" && index !== 0 && (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => cover(asset.id)}
                        title="Đặt làm ảnh đại diện"
                      >
                        <Star size={14} /> Đại diện
                      </button>
                    )}
                    {index > 0 && (
                      <button
                        type="button"
                        disabled={disabled}
                        aria-label="Đưa lên trước"
                        onClick={() => {
                          const next = [...media.ids]
                          ;[next[index - 1], next[index]] = [
                            next[index],
                            next[index - 1],
                          ]
                          media.change(next)
                        }}
                      >
                        <ArrowLeft size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label="Gỡ khỏi nội dung"
                      title="Gỡ khỏi nội dung"
                      onClick={() =>
                        media.change(media.ids.filter((id) => id !== asset.id))
                      }
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <button
            type="button"
            className="mg-library-toggle"
            disabled={disabled || !media.businessId}
            aria-expanded={libraryOpen}
            onClick={() => setLibraryOpen(!libraryOpen)}
          >
            <ImagePlus size={16} /> Chọn ảnh/video đã có trong thư viện
          </button>
          {libraryOpen && (
            <SearchableSelect
              multiple
              label="Tài nguyên trong thư viện"
              value={media.ids}
              onChange={media.change}
              disabled={disabled}
              loading={assets.isPending}
              options={all
                .filter(
                  (a) =>
                    a.status === "READY" &&
                    (section !== "products" || a.resourceType === "image")
                )
                .map((a) => ({
                  value: a.id,
                  label: String(a.originalFilename || a.altText || a.code),
                }))}
            />
          )}
          {media.dirty && (
            <p className="mg-media-pending" role="status">
              Có thay đổi ảnh chưa lưu. Bấm Lưu thay đổi để áp dụng.
            </p>
          )}
          {media.ids.length > 50 && (
            <p className="mg-error" role="alert">
              Mỗi nội dung được chọn tối đa 50 ảnh/video.
            </p>
          )}
        </>
      )}
    </fieldset>
  )
}
function ownerError(error: Error | null) {
  return error ? (
    <p className="mg-error" role="alert">
      Không xác định được cơ sở sở hữu ảnh. Vui lòng kiểm tra nội dung liên
      quan.
    </p>
  ) : null
}
