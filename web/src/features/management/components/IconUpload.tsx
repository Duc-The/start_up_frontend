import { useId, useState } from "react"
import { ImagePlus, LoaderCircle, X } from "lucide-react"
import { IMAGE_ACCEPT, uploadCloudinary } from "../api/cloudinaryUpload"

export default function IconUpload({
  value,
  onChange,
  required,
  onBusyChange,
}: {
  value: string
  onChange: (url: string) => void
  required?: boolean
  onBusyChange?: (busy: boolean) => void
}) {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  async function upload(file: File) {
    setBusy(true)
    onBusyChange?.(true)
    setError("")
    try {
      const image = await uploadCloudinary(file, { catalog: true })
      onChange(String(image.secureUrl))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được biểu tượng.")
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }
  return (
    <div className="mg-icon-upload">
      <span className="mg-field-label">
        Biểu tượng {required && <b aria-label="bắt buộc">*</b>}
      </span>
      <div className="mg-icon-upload-body" aria-busy={busy}>
        <div className="mg-icon-preview">
          {value ? (
            <img src={value} alt="Biểu tượng đã chọn" />
          ) : (
            <ImagePlus size={28} />
          )}
        </div>
        <div>
          <strong>
            {busy
              ? "Đang tải ảnh…"
              : value
                ? "Đã có biểu tượng"
                : "Chọn biểu tượng danh mục"}
          </strong>
          <p>JPG, PNG, WEBP, AVIF, GIF · Tối đa 10 MB</p>
          <div className="mg-upload-actions">
            <label htmlFor={id} className="mg-upload-pick">
              {busy ? (
                <LoaderCircle size={15} className="mg-spin" />
              ) : (
                <ImagePlus size={15} />
              )}
              {value ? "Thay ảnh" : "Chọn ảnh"}
            </label>
            {value && (
              <button
                type="button"
                disabled={busy}
                aria-label="Bỏ biểu tượng"
                onClick={() => onChange("")}
              >
                <X size={15} /> Bỏ ảnh
              </button>
            )}
          </div>
          <input
            id={id}
            className="mg-file-input"
            aria-label="Tải biểu tượng lên"
            type="file"
            accept={IMAGE_ACCEPT}
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ""
              if (f) void upload(f)
            }}
          />
        </div>
      </div>
      {error && (
        <p className="mg-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
