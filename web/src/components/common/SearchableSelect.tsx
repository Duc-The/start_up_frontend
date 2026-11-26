import { ConfigProvider, Select } from "antd"
import viVN from "antd/locale/vi_VN"
import { ChevronDown } from "lucide-react"
import { antdTheme } from "@/lib/antdTheme"
import { normalizeSearchText } from "@/utils/searchText"
type Common = {
  label: string
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  allowClear?: boolean
}
type Props = Common &
  (
    | { multiple: true; value: string[]; onChange: (value: string[]) => void }
    | { multiple?: false; value: string; onChange: (value: string) => void }
  )
export default function SearchableSelect(props: Props) {
  return (
    <ConfigProvider theme={antdTheme} locale={viVN}>
      <Select<string | string[]>
        aria-label={props.label}
        className={"ocop-search-select " + (props.className || "")}
        classNames={{ popup: { root: "ocop-select-popup" } }}
        style={{ width: "100%" }}
        value={props.value || undefined}
        mode={props.multiple ? "multiple" : undefined}
        placeholder={props.placeholder || "Gõ để tìm và chọn…"}
        options={props.options}
        loading={props.loading}
        disabled={props.disabled}
        allowClear={
          props.allowClear === false ? false : { label: "Xóa lựa chọn" }
        }
        suffix={<ChevronDown size={15} />}
        showSearch={{
          optionFilterProp: "label",
          filterOption: (input, option) =>
            normalizeSearchText(String(option?.label || "")).includes(
              normalizeSearchText(input)
            ),
        }}
        notFoundContent={
          <span className="ocop-select-empty">
            Không tìm thấy lựa chọn phù hợp
          </span>
        }
        maxTagCount="responsive"
        onChange={(value) => {
          if (props.multiple) props.onChange(Array.isArray(value) ? value : [])
          else props.onChange(typeof value === "string" ? value : "")
        }}
      />
    </ConfigProvider>
  )
}
