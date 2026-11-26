import {
  MapPin,
  ShoppingBasket,
  Landmark,
  Footprints,
  Star,
  SlidersHorizontal,
  RotateCcw,
  Check,
  X,
  ChevronDown,
  ParkingCircle,
} from "lucide-react"
import { useState } from "react"
import type { Filters, SearchFilters, Group } from "@/features/home/types"
import type { Option } from "@/features/pois/types"
import { flatten } from "@/utils/options"
interface Props {
  options?: Filters
  draft: SearchFilters
  onDraft: (next: SearchFilters) => void
  onApply: () => void
  onReset: () => void
  open: boolean
  onClose: () => void
  busy: boolean
}
export default function FilterSidebar({
  options,
  draft,
  onDraft,
  onApply,
  onReset,
  open,
  onClose,
  busy,
}: Props) {
  const [collapsed, setCollapsed] = useState<string[]>([])
  const toggle = (group: Group, id: string) => {
    const values = draft[group] || []
    onDraft({
      ...draft,
      [group]: values.includes(id)
        ? values.filter((x) => x !== id)
        : [...values, id],
    })
  }
  const sections: {
    key: Group
    title: string
    icon: React.ReactNode
    values: Option[]
    pills?: boolean
  }[] = [
    {
      key: "areaIds",
      title: "Khu vực",
      icon: <MapPin size={17} />,
      values: options?.areas || [],
    },
    {
      key: "productTypeIds",
      title: "Nhóm sản phẩm",
      icon: <ShoppingBasket size={17} />,
      values: options?.productTypes || [],
    },
    {
      key: "categoryIds",
      title: "Loại địa điểm",
      icon: <Landmark size={17} />,
      values: flatten(options?.categories || []),
    },
    {
      key: "activityIds",
      title: "Bạn muốn làm gì?",
      icon: <Footprints size={17} />,
      values: options?.activities || [],
      pills: true,
    },
    {
      key: "amenityIds",
      title: "Tiện ích",
      icon: <ParkingCircle size={17} />,
      values: options?.amenities || [],
    },
  ]
  return (
    <>
      <button
        className={"sidebar-backdrop" + (open ? " visible" : "")}
        onClick={onClose}
        aria-label="Đóng bộ lọc"
      />
      <aside className={"filter-sidebar" + (open ? " open" : "")}>
        <div className="sidebar-heading">
          <div>
            <SlidersHorizontal size={18} />
            <h2>Bộ lọc tìm kiếm</h2>
          </div>
          <button
            className="icon-button mobile-only"
            onClick={onClose}
            aria-label="Đóng bộ lọc"
          >
            <X size={19} />
          </button>
          <span className="filter-count">
            {Object.values(draft).filter(Array.isArray).flat().length}
          </span>
        </div>
        <div className="filter-scroll">
          {sections.map((section) => (
            <section
              className="filter-section"
              id={section.key}
              key={section.key}
            >
              <button
                className="filter-heading"
                onClick={() =>
                  setCollapsed((v) =>
                    v.includes(section.key)
                      ? v.filter((k) => k !== section.key)
                      : [...v, section.key]
                  )
                }
              >
                {section.icon}
                <h3>{section.title}</h3>
                <ChevronDown
                  size={14}
                  className={collapsed.includes(section.key) ? "rotated" : ""}
                />
              </button>
              {!collapsed.includes(section.key) && (
                <div
                  className={section.pills ? "filter-pills" : "filter-options"}
                >
                  {section.values.length ? (
                    section.values.map((option) => (
                      <label
                        key={option.id}
                        className={
                          section.pills
                            ? "filter-pill" +
                              (draft[section.key]?.includes(option.id)
                                ? " checked"
                                : "")
                            : "filter-option"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={
                            draft[section.key]?.includes(option.id) || false
                          }
                          onChange={() => toggle(section.key, option.id)}
                        />
                        <span>{option.name}</span>
                      </label>
                    ))
                  ) : (
                    <p className="filter-muted">
                      {busy ? "Đang tải lựa chọn…" : "Chưa có lựa chọn"}
                    </p>
                  )}
                </div>
              )}
            </section>
          ))}
          <section className="filter-section" id="ocopStars">
            <div className="filter-heading">
              <Star size={17} />
              <h3>Hạng OCOP</h3>
              <span className="tiny-label">CHỨNG NHẬN</span>
            </div>
            <div className="star-options">
              {(options?.ocopStars || [3, 4, 5]).map((star) => (
                <label
                  key={star}
                  className={
                    "star-option" +
                    (draft.ocopStars?.includes(String(star)) ? " checked" : "")
                  }
                >
                  <input
                    type="checkbox"
                    checked={draft.ocopStars?.includes(String(star)) || false}
                    onChange={() => toggle("ocopStars", String(star))}
                  />
                  <span>{star} sao</span>
                  <span className="gold-stars">{"★".repeat(star)}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
        <div className="filter-footer">
          <button
            className="button secondary"
            onClick={onReset}
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={16} />
          </button>
          <button className="button primary" onClick={onApply}>
            <Check size={17} />
            Áp dụng bộ lọc
          </button>
        </div>
      </aside>
    </>
  )
}
