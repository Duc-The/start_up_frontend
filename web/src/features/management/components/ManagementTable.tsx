import { Table, Button, Space, ConfigProvider, Empty } from "antd"
import viVN from "antd/locale/vi_VN"
import { Send, Check, X, Archive, Trash2 } from "lucide-react"
import { antdTheme } from "@/lib/antdTheme"
import type { Row } from "../types"
import { contentTypes } from "../config/managementConfig"
import Badge from "./Badge"
type Props = {
  page: number
  pageSize: number
  section: string
  admin: boolean
  items: Row[]
  loading: boolean
  onEdit: (row: Row) => void
  onAction: (row: Row, action: string) => Promise<void>
}
export default function ManagementTable({
  page,
  pageSize,
  section,
  admin,
  items,
  loading,
  onEdit,
  onAction,
}: Props) {
  return (
    <ConfigProvider locale={viVN} theme={antdTheme}>
      <Table<Row>
        rowKey="id"
        dataSource={items}
        loading={loading}
        pagination={false}
        scroll={{ x: 760 }}
        locale={{
          emptyText: (
            <Empty description="Chưa có dữ liệu trong danh sách này" />
          ),
        }}
        columns={[
          {
            title: "STT",
            key: "serialNumber",
            width: 68,
            align: "center",
            fixed: "left",
            className: "mg-serial-cell",
            render: (_value, _record, index) => page * pageSize + index + 1,
          },
          {
            title: "Nội dung",
            key: "name",
            render: (_, row) => (
              <div>
                {section === "media" &&
                  typeof row.secureUrl === "string" &&
                  row.secureUrl &&
                  (row.resourceType === "video" ? (
                    <video
                      controls
                      preload="metadata"
                      src={row.secureUrl}
                      style={{ width: 120 }}
                    />
                  ) : (
                    <img
                      loading="lazy"
                      src={row.secureUrl}
                      alt={String(row.altText || "")}
                      style={{
                        width: 80,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 5,
                      }}
                    />
                  ))}
                <strong>
                  {String(
                    row.name ||
                      row.displayName ||
                      row.orderId ||
                      row.originalFilename ||
                      row.targetType ||
                      row.code ||
                      "Tài nguyên"
                  )}
                </strong>
                <div>
                  {String(row.code || row.email || row.paymentId || "")}
                </div>
              </div>
            ),
          },
          {
            title: "Thông tin",
            key: "info",
            render: (_, row) =>
              String(
                row.details?.address ||
                  row.details?.description ||
                  row.altText ||
                  row.recipientName ||
                  row.comment ||
                  row.action ||
                  "—"
              ).slice(0, 90),
          },
          {
            title: "Trạng thái",
            key: "status",
            render: (_, row) => (
              <Badge value={row.publicationStatus || row.status} />
            ),
          },
          {
            title: "Thao tác",
            key: "actions",
            align: "right",
            render: (_, row) => (
              <Space>
                <Button size="small" onClick={() => onEdit(row)}>
                  Xem / sửa
                </Button>
                {(section === "listings" ||
                  (admin && section.startsWith("catalogs/"))) && (
                  <Button
                    aria-label={section === "listings" ? "Ngừng bán" : "Xóa"}
                    icon={<Trash2 size={15} />}
                    onClick={() => void onAction(row, "delete")}
                  />
                )}
                {contentTypes.includes(section) && (
                  <>
                    {["DRAFT", "REJECTED"].includes(
                      row.publicationStatus || ""
                    ) && (
                      <Button
                        aria-label="Gửi duyệt"
                        icon={<Send size={15} />}
                        onClick={() => void onAction(row, "submit")}
                      >
                        Gửi duyệt
                      </Button>
                    )}{" "}
                    {admin && row.publicationStatus === "PENDING_REVIEW" && (
                      <>
                        <Button
                          aria-label="Duyệt"
                          icon={<Check size={15} />}
                          onClick={() => void onAction(row, "approve")}
                        >
                          Duyệt
                        </Button>
                        <Button
                          aria-label="Từ chối"
                          icon={<X size={15} />}
                          onClick={() => void onAction(row, "reject")}
                        />
                      </>
                    )}
                    <Button
                      aria-label="Lưu trữ"
                      icon={<Archive size={15} />}
                      onClick={() => void onAction(row, "archive")}
                    />
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />
    </ConfigProvider>
  )
}
