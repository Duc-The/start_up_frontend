import { Leaf, MapPin, Route, ArrowUpRight } from "lucide-react"

import "@/assets/styles/management.css"
import {
  navigation,
  contentTypes,
} from "@/features/management/config/managementConfig"

import { useManagementWorkspace } from "@/features/management/hooks/useManagementWorkspace"

export default function ManagementOverview({
  workspace,
}: {
  workspace: ReturnType<typeof useManagementWorkspace>
}) {
  const { setSection, setStatus, dashboard, counts } = workspace
  return (
    <>
      <div className="mg-overview">
        <div>
          <span className="mg-live">
            <i /> Hệ thống đang kết nối
          </span>
          <h2>
            Đưa giá trị địa phương
            <br />
            đến gần hơn.
          </h2>
          <p>
            Quản lý nội dung chính xác hôm nay để mỗi lần khám phá đều là một
            trải nghiệm đáng nhớ.
          </p>
          <button onClick={() => setSection("pois")}>
            Quản lý địa điểm <ArrowUpRight size={17} />
          </button>
        </div>
        <div className="mg-illustration">
          <MapPin size={68} />
          <Route size={90} />
          <Leaf size={54} />
          <span>ĐÀ NẴNG</span>
        </div>
      </div>
      <div className="mg-metrics">
        {[
          ["Địa điểm", "pois"],
          ["Sản phẩm", "products"],
          ["Đơn hàng", "orders"],
          ["Chứng nhận sắp hết hạn", "expiringCertifications"],
        ].map(([label, key]) => (
          <div key={key}>
            <span>{label}</span>
            <strong>
              {dashboard.isPending
                ? "—"
                : (counts[key] || 0).toLocaleString("vi-VN")}
            </strong>
            <small>
              {key === "expiringCertifications"
                ? "Trong 30 ngày tới"
                : "Trong phạm vi quản lý của bạn"}
            </small>
          </div>
        ))}
      </div>
      <div className="mg-section-title">
        <h2>Công việc cần chú ý</h2>
        <span>Cập nhật từ dữ liệu hệ thống</span>
      </div>
      <div className="mg-tasks">
        {contentTypes.map((type) => (
          <button
            key={type}
            onClick={() => {
              setSection(type)
              setStatus("PENDING_REVIEW")
            }}
          >
            <span>{navigation.find((n) => n.key === type)?.label}</span>
            <strong>
              {counts[type + "Pending"] || 0} <small>chờ duyệt</small>
            </strong>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      {dashboard.error && (
        <p role="alert">
          {dashboard.error.message}
          <button onClick={() => void dashboard.refetch()}>Thử lại</button>
        </p>
      )}
    </>
  )
}
