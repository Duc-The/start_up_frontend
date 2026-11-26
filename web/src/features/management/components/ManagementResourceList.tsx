import SearchableSelect from "@/components/common/SearchableSelect"
import ManagementTable from "./ManagementTable"

import { Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

import "@/assets/styles/management.css"
import {
  MANAGEMENT_PAGE_SIZE,
  statuses,
  contentTypes,
} from "@/features/management/config/managementConfig"

import { useManagementWorkspace } from "@/features/management/hooks/useManagementWorkspace"

import MediaUpload from "@/features/management/components/MediaUpload"

export default function ManagementResourceList({
  workspace,
}: {
  workspace: ReturnType<typeof useManagementWorkspace>
}) {
  const {
    section,
    search,
    setSearch,
    page,
    setPage,
    status,
    setStatus,
    setEditor,
    admin,
    data,
    reload,
    action,
  } = workspace
  return (
    <>
      <div className="mg-toolbar">
        <label className="mg-search">
          <Search size={18} />
          <input
            aria-label="Tìm kiếm"
            placeholder="Tìm theo tên, từ khóa…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
          />
        </label>
        {contentTypes.includes(section) && (
          <SearchableSelect
            label="Lọc trạng thái"
            className="mg-status-select"
            value={status}
            placeholder="Tất cả trạng thái"
            options={[
              { value: "", label: "Tất cả trạng thái" },
              ...Object.entries(statuses)
                .filter(([key]) =>
                  [
                    "DRAFT",
                    "PENDING_REVIEW",
                    "PUBLISHED",
                    "REJECTED",
                    "ARCHIVED",
                  ].includes(key)
                )
                .map(([value, label]) => ({ value, label })),
            ]}
            onChange={(value) => {
              setStatus(value)
              setPage(0)
            }}
          />
        )}
        <button aria-label="Làm mới" onClick={() => void data.refetch()}>
          <RefreshCw size={17} />
        </button>
      </div>
      {section === "media" && <MediaUpload onDone={reload} />}
      <div className="mg-table-wrap">
        {data.error ? (
          <p className="mg-error" role="alert">
            {data.error.message}
            <button onClick={() => void data.refetch()}>Thử lại</button>
          </p>
        ) : (
          <ManagementTable
            page={data.data?.page ?? page}
            pageSize={data.data?.size ?? MANAGEMENT_PAGE_SIZE}
            section={section}
            admin={admin}
            items={data.data?.items || []}
            loading={data.isPending}
            onEdit={setEditor}
            onAction={action}
          />
        )}
      </div>
      <footer className="mg-pagination">
        <span>
          {data.data?.total || 0} kết quả · Trang {page + 1}
        </span>
        <div>
          <button
            aria-label="Trang trước"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            aria-label="Trang sau"
            disabled={
              !data.data || (page + 1) * MANAGEMENT_PAGE_SIZE >= data.data.total
            }
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </footer>
    </>
  )
}
