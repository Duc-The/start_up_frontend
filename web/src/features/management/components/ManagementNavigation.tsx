import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { navigationTree, type Nav } from "../config/managementConfig"
type Props = {
  section: string
  admin: boolean
  counts: Record<string, number>
  onSelect: (key: string) => void
}
export default function ManagementNavigation({
  section,
  admin,
  counts,
  onSelect,
}: Props) {
  const [expanded, setExpanded] = useState<
    Record<string, { open: boolean; section: string }>
  >({})
  function item(entry: Nav, child = false) {
    return (
      <button
        key={entry.key}
        type="button"
        className={
          (section === entry.key ? "selected " : "") +
          (child ? "mg-nav-child" : "")
        }
        aria-current={section === entry.key ? "page" : undefined}
        onClick={() => onSelect(entry.key)}
      >
        <entry.icon size={child ? 15 : 18} />
        <span>{entry.label}</span>
        {entry.key === "pois" && counts.poisPending > 0 && (
          <small aria-label={counts.poisPending + " địa điểm chờ duyệt"}>
            {counts.poisPending}
          </small>
        )}
      </button>
    )
  }
  return (
    <nav aria-label="Chức năng quản lý">
      {navigationTree.map((entry) => {
        if (!("children" in entry))
          return !entry.admin || admin ? item(entry) : null
        const children = entry.children.filter((child) => !child.admin || admin)
        if (!children.length) return null
        const active = children.some((child) => child.key === section),
          snapshot = expanded[entry.key]
        const open =
          active && snapshot?.section !== section
            ? true
            : (snapshot?.open ?? active)
        const controls = "mg-nav-" + entry.key
        return (
          <div
            key={entry.key}
            className={"mg-nav-group " + (active ? "mg-nav-group-active" : "")}
          >
            <button
              type="button"
              className="mg-nav-parent"
              aria-expanded={open}
              aria-controls={controls}
              onClick={() =>
                setExpanded((previous) => ({
                  ...previous,
                  [entry.key]: { open: !open, section },
                }))
              }
            >
              <entry.icon size={18} />
              <span>{entry.label}</span>
              <ChevronDown
                size={15}
                className={
                  "mg-nav-chevron " + (open ? "mg-nav-chevron-open" : "")
                }
              />
            </button>
            <div id={controls} className="mg-nav-children" hidden={!open}>
              {children.map((child) => item(child, true))}
            </div>
          </div>
        )
      })}
    </nav>
  )
}
