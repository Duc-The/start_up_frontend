import { useQueryClient } from "@tanstack/react-query"
import { useEditorMedia } from "../hooks/useEditorMedia"
import { saveEditorRecord } from "../api/saveEditorRecord"
import { normalizeCatalogCode } from "@/utils/catalogCode"
import { Modal, ConfigProvider } from "antd"
import viVN from "antd/locale/vi_VN"
import { antdTheme } from "@/lib/antdTheme"
import {
  catalogFields as catalogFieldMap,
  requiredFields,
} from "../config/editorConfig"
import { navigation } from "../config/managementConfig"
import { requestManagementReason } from "@/components/common/managementDialogs"
import SearchableSelect from "@/components/common/SearchableSelect"
import { useState } from "react"

import { useQuery } from "@tanstack/react-query"

import { Check, LoaderCircle } from "lucide-react"

import { toast } from "sonner"

import { managementApi } from "@/features/management/api/managementApi"

import type { PageData } from "@/types/api"

import "@/assets/styles/management.css"
import type { Row, Choice } from "@/features/management/types"

import {
  words,
  contentTypes,
  base,
} from "@/features/management/config/managementConfig"

import Attachments from "./Attachments"

import OperationalControls from "./OperationalControls"

import Field from "./Field"

export default function Editor({
  section,
  row,
  admin,
  onClose,
  onDone,
}: {
  section: string
  row: Row
  admin: boolean
  onClose: () => void
  onDone: () => void
}) {
  const client = useQueryClient()
  const [record, setRecord] = useState(row)
  const [form, setForm] = useState<Record<string, unknown>>(
      section.startsWith("catalogs/")
        ? {
            name: row.name || "",
            code: row.code || "",
            slug: row.slug || "",
            iconUrl: row.iconUrl || "",
            colorHex: row.colorHex || "#24823C",
            parentId: row.parentId || null,
            sortOrder: row.sortOrder || 0,
            active: row.active ?? true,
          }
        : { ...row.details }
    ),
    [uploadBusy, setUploadBusy] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("")
  const media = useEditorMedia(section, record, form)
  const savingDisabled =
    busy ||
    uploadBusy ||
    media.loading ||
    !!media.error ||
    media.ids.length > 50
  const choices = useQuery<Record<string, Choice[]>>({
    queryKey: ["management", "choices", section],
    enabled: section !== "catalogs/areas",
    queryFn: async () => {
      const [filters, businesses, pois, products] = await Promise.all([
        managementApi<Record<string, Choice[]>>("/home/filters"),
        managementApi<PageData<Choice>>(base + "businesses?size=100"),
        managementApi<PageData<Choice>>(base + "pois?size=100"),
        managementApi<PageData<Choice>>(base + "products?size=100"),
      ])
      return {
        ...filters,
        businesses: businesses.items,
        pois: pois.items,
        products: products.items,
      }
    },
  })
  const editable =
    (!!row.details || (section.startsWith("catalogs/") && admin)) &&
    (section !== "businesses" || admin || !!row.id)
  const change = (key: string, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }))
  async function save() {
    if (savingDisabled) return
    const missing = (requiredFields[section] || []).filter(
      (key) =>
        form[key] === null ||
        form[key] === undefined ||
        String(form[key]).trim() === ""
    )
    if (missing.length) {
      setError(
        "Vui lòng nhập đầy đủ: " +
          missing
            .map((key) =>
              key === "code" && section === "catalogs/areas"
                ? "Mã khu vực"
                : words[key] || key
            )
            .join(", ")
      )
      return
    }
    setBusy(true)
    setError("")
    try {
      const body: Record<string, unknown> = {
        ...form,
        version: record.version ?? form.version,
      }
      if (section.startsWith("catalogs/") && typeof body.code === "string")
        body.code = normalizeCatalogCode(body.code)
      if (
        [
          "catalogs/areas",
          "catalogs/activities",
          "catalogs/amenities",
        ].includes(section) &&
        !/^[A-Z][A-Z0-9_]*$/.test(String(body.code || ""))
      )
        throw new Error(
          "Mã phải bắt đầu bằng chữ A–Z, chỉ gồm chữ viết hoa, số và dấu gạch dưới (_). Ví dụ: HAI_CHAU."
        )
      if (section === "certifications" && body.type === "OTHER")
        delete (body as Record<string, unknown>).ocopStars
      await saveEditorRecord({
        section,
        record,
        fields: body,
        mediaIds: media.dirty ? media.ids : undefined,
        onSaved: setRecord,
      })
      await Promise.all(
        [
          "management",
          "pois",
          "markers",
          "detail",
          "filters",
          "poi-products",
          "suggestions",
        ].map((key) => client.invalidateQueries({ queryKey: [key] }))
      )
      toast.success(
        contentTypes.includes(section)
          ? "Đã lưu thông tin và ảnh thành bản nháp. Gửi duyệt, sau đó duyệt để hiển thị trên website."
          : "Đã lưu thông tin và ảnh",
        { duration: 7000 }
      )
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không lưu được dữ liệu")
      // A media failure may happen after the metadata was saved; refresh affected lists too.
      void Promise.all(
        ["management", "pois", "markers", "detail"].map((key) =>
          client.invalidateQueries({ queryKey: [key] })
        )
      )
    } finally {
      setBusy(false)
    }
  }
  const catalogFields = catalogFieldMap[section]
  const definition = navigation.find((item) => item.key === section)
  const label = definition?.label.toLocaleLowerCase("vi") || "nội dung"
  const title = editable
    ? (record.id ? "Chỉnh sửa " : "Thêm ") + label
    : "Chi tiết " + label
  const Icon = definition?.icon
  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <Modal
        open
        centered
        destroyOnHidden
        className="mg-crud-modal"
        width={section === "catalogs/areas" ? 600 : 820}
        mask={{ closable: false }}
        keyboard={!busy && !uploadBusy}
        closable={!busy && !uploadBusy}
        onCancel={() => {
          if (!busy && !uploadBusy) onClose()
        }}
        title={
          <div className="mg-modal-heading">
            {Icon && (
              <span className="mg-modal-icon">
                <Icon size={23} />
              </span>
            )}
            <div>
              <h2>{title}</h2>
              <p>
                {row.id
                  ? record.code || "Xem và cập nhật thông tin của bạn"
                  : "Điền thông tin bên dưới để tạo mới " + label + "."}
              </p>
            </div>
          </div>
        }
        styles={{ body: { maxHeight: "min(65vh,680px)", overflowY: "auto" } }}
        footer={
          <div className="mg-modal-footer">
            <span>
              {row.id
                ? contentTypes.includes(section)
                  ? "Lưu bản nháp → Gửi duyệt → Duyệt để hiển thị trên website."
                  : "Thông tin và ảnh sẽ được lưu cùng nhau."
                : "Thông tin được lưu sau khi bạn xác nhận."}
            </span>
            <div>
              <button
                type="button"
                className="mg-modal-cancel"
                disabled={busy || uploadBusy}
                onClick={onClose}
              >
                {editable ? "Hủy" : "Đóng"}
              </button>
              {editable && (
                <button
                  type="button"
                  className="mg-primary"
                  disabled={savingDisabled}
                  onClick={() => void save()}
                >
                  {busy ? (
                    <LoaderCircle className="mg-spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}{" "}
                  {busy ? "Đang lưu…" : record.id ? "Lưu thay đổi" : "Thêm mới"}
                </button>
              )}
            </div>
          </div>
        }
      >
        <div className="mg-fields mg-modal-fields">
          {editable ? (
            <section className="mg-form-section">
              <div className="mg-form-section-title">
                <h3>Thông tin cơ bản</h3>
                <span>
                  <b>*</b> Thông tin bắt buộc
                </span>
              </div>
              <div className="mg-form-grid">
                {Object.entries(form)
                  .filter(
                    ([key]) =>
                      key !== "version" &&
                      (!catalogFields || catalogFields.includes(key))
                  )
                  .map(([k, v]) => (
                    <Field
                      key={k}
                      name={k}
                      onUploadBusyChange={setUploadBusy}
                      label={
                        k === "active"
                          ? "Trạng thái"
                          : k === "code" && section === "catalogs/areas"
                            ? "Mã khu vực"
                            : undefined
                      }
                      required={(requiredFields[section] || []).includes(k)}
                      parentOptions={
                        section === "catalogs/poi-categories"
                          ? choices.data?.categories
                          : undefined
                      }
                      value={v}
                      choices={choices.data || {}}
                      change={(value) => change(k, value)}
                    />
                  ))}
              </div>
            </section>
          ) : (
            <dl>
              {Object.entries(row)
                .filter(([k]) => k !== "id")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>{words[k] || k}</dt>
                    <dd>
                      {typeof v === "object"
                        ? JSON.stringify(v)
                        : String(v ?? "—")}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
          {section === "users" && admin && (
            <label>
              Vai trò
              <SearchableSelect
                label="Vai trò"
                value={String(((row.roles as string[]) || [])[0] || "CUSTOMER")}
                allowClear={false}
                options={[
                  { value: "CUSTOMER", label: "Khách hàng" },
                  { value: "PARTNER", label: "Đối tác" },
                  { value: "ADMIN", label: "Quản trị viên" },
                ]}
                onChange={async (value) => {
                  await managementApi(base + "users/" + row.id + "/roles", {
                    method: "PUT",
                    body: JSON.stringify({ roles: [value] }),
                  })
                  toast.success("Đã cập nhật quyền")
                  onDone()
                }}
              />
            </label>
          )}
          {section.startsWith("reviews/") && admin && (
            <button
              onClick={async () => {
                const reason = await requestManagementReason(
                  "Kiểm duyệt đánh giá"
                )
                if (!reason) return
                await managementApi(base + section + "/" + row.id, {
                  method: "PATCH",
                  body: JSON.stringify({
                    status: row.status === "HIDDEN" ? "PUBLISHED" : "HIDDEN",
                    reason,
                  }),
                })
                onDone()
              }}
            >
              Ẩn / hiện đánh giá
            </button>
          )}
          {row.id && (
            <OperationalControls
              section={section}
              row={row}
              admin={admin}
              onDone={onDone}
            />
          )}
          {media.supported && (
            <Attachments
              section={section}
              media={media}
              disabled={busy || uploadBusy}
              onBusyChange={setUploadBusy}
            />
          )}
          {error && (
            <p className="mg-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </Modal>
    </ConfigProvider>
  )
}
