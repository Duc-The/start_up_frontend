import ManagementHeader from "@/features/management/components/ManagementHeader"
import { Leaf, LogOut } from "lucide-react"

import { Toaster } from "sonner"

import { logout } from "@/services/httpClient"

import "@/assets/styles/management.css"
import ManagementNavigation from "@/features/management/components/ManagementNavigation"

import { useManagementWorkspace } from "@/features/management/hooks/useManagementWorkspace"

import type { ReactNode } from "react"

export default function DashboardLayout({
  workspace,
  children,
}: {
  workspace: ReturnType<typeof useManagementWorkspace>
  children: ReactNode
}) {
  const {
    user,
    section,
    setSection,
    setSearch,
    setPage,
    setStatus,
    mobile,
    setMobile,
    admin,
    counts,
  } = workspace
  if (!user) return null
  return (
    <div className="mg-app">
      <Toaster richColors position="top-right" />
      <aside className={"mg-sidebar " + (mobile ? "mg-open" : "")}>
        <a href="/" className="mg-brand">
          <span>
            <Leaf />
          </span>
          OCOP<span className="mg-orange">GO</span>
        </a>
        <div className="mg-workspace">
          {admin ? "Không gian quản trị" : "Không gian đối tác"}
          <span>Đà Nẵng · Việt Nam</span>
        </div>
        <ManagementNavigation
          section={section}
          admin={admin}
          counts={counts}
          onSelect={(key) => {
            setSection(key)
            setPage(0)
            setSearch("")
            setStatus("")
            setMobile(false)
          }}
        />

        <div className="mg-user">
          <span className="mg-avatar">{user.displayName.slice(0, 1)}</span>
          <div>
            <strong>{user.displayName}</strong>
            <small>{admin ? "Quản trị viên" : "Đối tác"}</small>
          </div>
          <button
            aria-label="Đăng xuất"
            onClick={() => void logout().then(() => location.assign("/"))}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="mg-main">
        <ManagementHeader workspace={workspace} />

        <div className="mg-body">
          {children}
          <footer className="mg-footnote">
            OCOP GO <span>Chạm bản sắc · Mở hành trình</span>
          </footer>
        </div>
      </main>
    </div>
  )
}
