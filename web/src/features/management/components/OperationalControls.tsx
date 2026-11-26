import { confirmManagementAction } from "@/components/common/managementDialogs"
import SearchableSelect from "@/components/common/SearchableSelect"
import { useState } from "react"

import { useQuery } from "@tanstack/react-query"

import { toast } from "sonner"

import { managementApi } from "@/features/management/api/managementApi"

import type { PageData } from "@/types/api"

import "@/assets/styles/management.css"
import type { Row } from "@/features/management/types"

import { statuses, base } from "@/features/management/config/managementConfig"

export default function OperationalControls({
  section,
  row,
  admin,
  onDone,
}: {
  section: string
  row: Row
  admin: boolean
  onDone: () => void
}) {
  const [selected, setSelected] = useState(""),
    [error, setError] = useState("")
  const members = useQuery({
    queryKey: ["management", "members", row.id],
    queryFn: () =>
      managementApi<{ userId: string; displayName: string; email: string }[]>(
        base + "businesses/" + row.id + "/members"
      ),
    enabled: section === "businesses",
  })
  const users = useQuery({
    queryKey: ["management", "staff-options"],
    queryFn: () => managementApi<PageData<Row>>(base + "users?size=100"),
    enabled: section === "businesses" && admin,
  })
  async function run(path: string, method: string, body?: unknown) {
    if (
      method === "DELETE" &&
      !(await confirmManagementAction(
        section === "media" ? "Xóa tài nguyên?" : "Gỡ quyền quản lý?",
        section === "media"
          ? "Tệp sẽ được xóa khỏi Cloudinary. Tài nguyên đang sử dụng được hệ thống bảo vệ."
          : "Tài khoản này sẽ không còn quyền quản lý cơ sở này.",
        section === "media" ? "Xóa tài nguyên" : "Gỡ quyền"
      ))
    )
      return
    try {
      await managementApi(base + path, {
        method,
        body: body ? JSON.stringify(body) : undefined,
      })
      toast.success("Đã cập nhật")
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không cập nhật được dữ liệu")
    }
  }
  return (
    <>
      {section === "businesses" && (
        <fieldset>
          <legend>Người quản lý cơ sở</legend>
          {members.data?.map((m) => (
            <div key={m.userId}>
              <strong>{m.displayName}</strong>
              <p>{m.email}</p>
              {admin && (
                <button
                  onClick={() =>
                    void run(
                      "businesses/" + row.id + "/members/" + m.userId,
                      "DELETE"
                    )
                  }
                >
                  Gỡ khỏi cơ sở
                </button>
              )}
            </div>
          ))}
          {admin && (
            <>
              <SearchableSelect
                label="Chọn thành viên"
                value={selected}
                onChange={setSelected}
                loading={users.isPending}
                options={(users.data?.items || []).map((user) => ({
                  value: user.id,
                  label: String(user.displayName) + " · " + String(user.email),
                }))}
              />

              <button
                disabled={!selected}
                onClick={() =>
                  void run(
                    "businesses/" + row.id + "/members/" + selected,
                    "PUT"
                  )
                }
              >
                Gán quyền quản lý cơ sở
              </button>
            </>
          )}
        </fieldset>
      )}
      {section === "users" && admin && (
        <button
          onClick={() =>
            void run("users/" + row.id + "/status", "PATCH", {
              status: row.status === "ACTIVE" ? "UNACTIVE" : "ACTIVE",
            })
          }
        >
          {row.status === "ACTIVE"
            ? "Khóa tài khoản và thu hồi phiên"
            : "Mở khóa tài khoản"}
        </button>
      )}
      {section === "orders" && (
        <fieldset>
          <legend>Xử lý giao hàng</legend>
          {(
            (row.items || []) as {
              id: string
              productName: string
              quantity: number
              fulfillmentStatus: string
            }[]
          ).map((item) => (
            <div key={item.id}>
              <strong>
                {item.productName} × {item.quantity}
              </strong>
              <p>
                {statuses[item.fulfillmentStatus] || item.fulfillmentStatus}
              </p>
              {item.fulfillmentStatus !== "COMPLETED" && (
                <button
                  onClick={() =>
                    void run(
                      "orders/" + row.id + "/items/" + item.id + "/fulfillment",
                      "PATCH",
                      {
                        status:
                          item.fulfillmentStatus === "PENDING"
                            ? "SHIPPED"
                            : "COMPLETED",
                      }
                    )
                  }
                >
                  {item.fulfillmentStatus === "PENDING"
                    ? "Xác nhận đã gửi hàng"
                    : "Xác nhận giao thành công"}
                </button>
              )}
            </div>
          ))}
        </fieldset>
      )}
      {section === "media" && (
        <button onClick={() => void run("media/" + row.id, "DELETE")}>
          Xóa tài nguyên không sử dụng
        </button>
      )}
      {error && (
        <p role="alert" className="mg-error">
          {error}
        </p>
      )}
    </>
  )
}
