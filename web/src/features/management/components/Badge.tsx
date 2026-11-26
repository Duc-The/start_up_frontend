import "@/assets/styles/management.css"
import { statuses } from "@/features/management/config/managementConfig"

export default function Badge({ value }: { value?: string }) {
  return (
    <span className={"mg-badge mg-" + value}>
      {statuses[value || ""] || value || "—"}
    </span>
  )
}
