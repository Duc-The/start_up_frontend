import IconUpload from "./IconUpload"
import { normalizeCatalogCode } from "@/utils/catalogCode"
import { ConfigProvider, Switch } from "antd"
import { antdTheme } from "@/lib/antdTheme"
import SearchableSelect from "@/components/common/SearchableSelect"
import "@/assets/styles/management.css"
import type { Choice } from "@/features/management/types"

import { words } from "@/features/management/config/managementConfig"

function flatten(options: Choice[]): Choice[] {
  return options.flatMap((o) => [o, ...flatten(o.children || [])])
}
export default function Field({
  name,
  value,
  choices,
  change,
  required = false,
  label,
  parentOptions,
  onUploadBusyChange,
}: {
  onUploadBusyChange?: (busy: boolean) => void
  label?: string
  required?: boolean
  parentOptions?: Choice[]
  name: string
  value: unknown
  choices: Record<string, Choice[]>
  change: (v: unknown) => void
}) {
  const fieldLabel = label || words[name] || name
  const refs: Record<string, string> = {
    businessId: "businesses",
    areaId: "areas",
    manufacturerPoiId: "pois",
    poiId: "pois",
    productId: "products",
    productTypeId: "productTypes",
    parentId: "productTypes",
    categoryIds: "categories",
    activityIds: "activities",
    amenityIds: "amenities",
  }
  const options = flatten(
    (name === "parentId" ? parentOptions : undefined) ||
      choices[refs[name]] ||
      []
  )
  if (name === "iconUrl")
    return (
      <IconUpload
        value={String(value || "")}
        onChange={change}
        required={required}
        onBusyChange={onUploadBusyChange}
      />
    )
  if (name === "openingHours")
    return (
      <fieldset>
        <legend>Giờ mở cửa</legend>
        {[
          "monday",
          "tuesday",
          "wednesday",
          "thursday",
          "friday",
          "saturday",
          "sunday",
        ].map((day, i) => {
          const hours = (
            value as Record<string, { open: string; close: string }[]>
          )[day]?.[0]
          return (
            <div className="mg-hours" key={day}>
              <label>
                <input
                  type="checkbox"
                  checked={!!hours}
                  onChange={(e) =>
                    change({
                      ...(value as object),
                      [day]: e.target.checked
                        ? [{ open: "08:00", close: "17:00" }]
                        : [],
                    })
                  }
                />
                {
                  [
                    "Thứ hai",
                    "Thứ ba",
                    "Thứ tư",
                    "Thứ năm",
                    "Thứ sáu",
                    "Thứ bảy",
                    "Chủ nhật",
                  ][i]
                }
              </label>
              {hours && (
                <>
                  <input
                    aria-label={"Mở cửa " + day}
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      change({
                        ...(value as object),
                        [day]: [{ ...hours, open: e.target.value }],
                      })
                    }
                  />
                  <input
                    aria-label={"Đóng cửa " + day}
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      change({
                        ...(value as object),
                        [day]: [{ ...hours, close: e.target.value }],
                      })
                    }
                  />
                </>
              )}
            </div>
          )
        })}
      </fieldset>
    )
  if (name === "sections") {
    const sections = value as {
      heading: string
      body: string
      mediaIds: string[]
    }[]
    return (
      <fieldset>
        <legend>Các phần câu chuyện</legend>
        {sections.map((s, i) => (
          <div key={i}>
            <input
              aria-label="Tiêu đề phần"
              placeholder="Tiêu đề phần"
              value={s.heading}
              onChange={(e) =>
                change(
                  sections.map((x, j) =>
                    j === i ? { ...x, heading: e.target.value } : x
                  )
                )
              }
            />
            <textarea
              aria-label="Nội dung phần"
              value={s.body}
              onChange={(e) =>
                change(
                  sections.map((x, j) =>
                    j === i ? { ...x, body: e.target.value } : x
                  )
                )
              }
            />
            <button onClick={() => change(sections.filter((_, j) => j !== i))}>
              Bỏ phần này
            </button>
          </div>
        ))}
        <button
          onClick={() =>
            change([...sections, { heading: "", body: "", mediaIds: [] }])
          }
        >
          Thêm phần nội dung
        </button>
      </fieldset>
    )
  }
  if (name === "socialLinks")
    return (
      <label>
        Facebook / mạng xã hội
        <input
          type="url"
          value={String((value as Record<string, string>).facebook || "")}
          onChange={(e) =>
            change(e.target.value ? { facebook: e.target.value } : {})
          }
        />
      </label>
    )
  return (
    <label>
      <span className="mg-field-label">
        {fieldLabel}
        {required && <b aria-label="bắt buộc"> *</b>}
      </span>
      {typeof value === "boolean" ? (
        <span className="mg-switch-line">
          <ConfigProvider theme={antdTheme}>
            <Switch
              aria-label={words[name] || name}
              checked={value}
              onChange={change}
            />
          </ConfigProvider>
          <span>{value ? "Đang hoạt động" : "Tạm ngừng"}</span>
        </span>
      ) : refs[name] ? (
        Array.isArray(value) ? (
          <SearchableSelect
            multiple
            label={words[name] || name}
            value={value.map(String)}
            onChange={change}
            options={options.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        ) : (
          <SearchableSelect
            label={words[name] || name}
            value={String(value || "")}
            placeholder={"Chọn " + (words[name]?.toLowerCase() || "thông tin")}
            onChange={change}
            options={options.map((option) => ({
              value: option.id,
              label: option.name,
            }))}
          />
        )
      ) : name === "type" ? (
        <SearchableSelect
          label="Loại chứng nhận"
          value={String(value)}
          allowClear={false}
          onChange={change}
          options={[
            { value: "OCOP", label: "Chứng nhận OCOP" },
            { value: "OTHER", label: "Chứng nhận khác" },
          ]}
        />
      ) : ["description", "introduction"].includes(name) ? (
        <textarea
          rows={5}
          value={String(value || "")}
          onChange={(e) => change(e.target.value)}
        />
      ) : (
        <input
          type={
            typeof value === "number"
              ? "number"
              : name.endsWith("On")
                ? "date"
                : name.endsWith("At")
                  ? "datetime-local"
                  : "text"
          }
          value={
            name.endsWith("At")
              ? String(value ?? "").slice(0, 16)
              : String(value ?? "")
          }
          onBlur={() => {
            if (name === "code")
              change(normalizeCatalogCode(String(value ?? "")))
          }}
          onChange={(e) =>
            change(
              typeof value === "number"
                ? Number(e.target.value)
                : name.endsWith("At")
                  ? e.target.value
                    ? new Date(e.target.value).toISOString()
                    : ""
                  : e.target.value
            )
          }
        />
      )}
    </label>
  )
}
