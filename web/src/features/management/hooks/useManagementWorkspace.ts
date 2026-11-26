import {
  confirmManagementAction,
  requestManagementReason,
} from "@/components/common/managementDialogs"
import { useAppDispatch, useAppSelector } from "@/hooks/useAppStore"
import { setManagementSection, setSidebarOpen } from "@/stores/uiSlice"

import { useState, useDeferredValue } from "react"

import { useQuery, useQueryClient } from "@tanstack/react-query"

import { toast } from "sonner"

import { managementApi } from "@/features/management/api/managementApi"
import { params } from "@/services/httpClient"

import { useAuth } from "@/features/auth/hooks/useAuth"

import type { PageData } from "@/types/api"

import defaults from "@/features/management/config/forms.json"

import "@/assets/styles/management.css"
import type { Row } from "@/features/management/types"

import {
  navigation,
  base,
  MANAGEMENT_PAGE_SIZE,
} from "@/features/management/config/managementConfig"

export function useManagementWorkspace() {
  const user = useAuth(),
    client = useQueryClient()
  const section = useAppSelector((state) => state.ui.managementSection)
  const mobile = useAppSelector((state) => state.ui.sidebarOpen)
  const dispatch = useAppDispatch()
  const setSection = (value: string) => dispatch(setManagementSection(value))
  const setMobile = (value: boolean) => dispatch(setSidebarOpen(value))
  const [search, setSearch] = useState(""),
    [page, setPage] = useState(0),
    [status, setStatus] = useState(""),
    [editor, setEditor] = useState<Row | null>(null),
    [login, setLogin] = useState(false)
  const keyword = useDeferredValue(search)
  const admin = !!user?.roles.includes("ADMIN")
  const allowed = !!user && (admin || user.roles.includes("PARTNER"))
  const current = navigation.find((n) => n.key === section)!
  const data = useQuery({
    queryKey: ["management", user?.id, section, keyword, page, status],
    queryFn: () =>
      managementApi<PageData<Row>>(
        base +
          section +
          "?" +
          params({
            keyword,
            page,
            size: MANAGEMENT_PAGE_SIZE,
            status: status || undefined,
          })
      ),
    enabled: allowed && section !== "dashboard",
  })
  const dashboard = useQuery({
    queryKey: ["management", "dashboard", user?.id],
    queryFn: () =>
      managementApi<{ counts: Record<string, number> }>(base + "dashboard"),
    enabled: allowed,
  })
  const reload = () => client.invalidateQueries({ queryKey: ["management"] })
  async function action(row: Row, operation: string) {
    try {
      let body: Record<string, unknown> = { version: row.version }
      if (operation === "reject") {
        const reason = await requestManagementReason(
          "Yêu cầu chỉnh sửa nội dung"
        )
        if (!reason) return
        body = { ...body, reason }
      }
      if (
        ["archive", "delete"].includes(operation) &&
        !(await confirmManagementAction(
          operation === "archive"
            ? "Lưu trữ nội dung?"
            : section === "listings"
              ? "Ngừng bán sản phẩm?"
              : "Xóa dữ liệu?",
          operation === "archive"
            ? "Nội dung sẽ được ẩn khỏi trang công khai. Lịch sử vẫn được giữ lại."
            : section === "listings"
              ? "Sản phẩm tại điểm bán này sẽ ngừng hiển thị để mua."
              : "Dữ liệu đang được sử dụng sẽ được hệ thống bảo vệ và không thể xóa.",
          operation === "archive"
            ? "Lưu trữ"
            : section === "listings"
              ? "Ngừng bán"
              : "Xác nhận xóa"
        ))
      )
        return
      await managementApi(
        base +
          section +
          "/" +
          row.id +
          (operation === "archive"
            ? "?version=" + row.version
            : operation === "delete"
              ? ""
              : "/" + operation),
        {
          method: ["archive", "delete"].includes(operation) ? "DELETE" : "POST",
          body: ["archive", "delete"].includes(operation)
            ? undefined
            : JSON.stringify(body),
        }
      )
      toast.success("Đã cập nhật nội dung")
      void reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể cập nhật")
    }
  }

  const counts = dashboard.data?.counts || {}
  const createAllowed =
    !!(defaults as Record<string, unknown>)[section] ||
    (section.startsWith("catalogs/") && admin)

  return {
    user,
    client,
    section,
    setSection,
    search,
    setSearch,
    page,
    setPage,
    status,
    setStatus,
    editor,
    setEditor,
    login,
    setLogin,
    mobile,
    setMobile,
    keyword,
    admin,
    allowed,
    current,
    data,
    dashboard,
    reload,
    action,
    counts,
    createAllowed,
  }
}
