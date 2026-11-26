import { useState } from "react"
import { Breadcrumb, ConfigProvider, Dropdown } from "antd"
import {
  ArrowUpRight,
  ChevronDown,
  Home,
  LogOut,
  Menu,
  ShieldCheck,
  Store,
} from "lucide-react"
import { Link } from "react-router-dom"
import { antdTheme } from "@/lib/antdTheme"
import { navigationTree } from "../config/managementConfig"
import type { useManagementWorkspace } from "../hooks/useManagementWorkspace"
import { logout } from "@/services/httpClient"
import { toast } from "sonner"
type Props = { workspace: ReturnType<typeof useManagementWorkspace> }
export default function ManagementHeader({ workspace }: Props) {
  const {
    user,
    admin,
    current,
    section,
    setSection,
    setPage,
    setSearch,
    setStatus,
    mobile,
    setMobile,
  } = workspace
  const [menuOpen, setMenuOpen] = useState(false)
  if (!user) return null
  const parent = navigationTree.find(
    (entry) =>
      "children" in entry &&
      entry.children.some((child) => child.key === section)
  )
  function overview() {
    setSection("dashboard")
    setPage(0)
    setSearch("")
    setStatus("")
    setMobile(false)
    setMenuOpen(false)
  }
  async function signOut() {
    try {
      await logout()
    } catch {
      toast.error("Chưa xác nhận được đăng xuất với máy chủ")
    } finally {
      location.assign("/login")
    }
  }
  const RoleIcon = admin ? ShieldCheck : Store
  const menu = {
    items: [
      {
        key: "overview",
        label: "Về tổng quan",
        icon: <Home size={15} />,
        onClick: overview,
      },
      {
        key: "website",
        label: <Link to="/">Trang khám phá OCOP GO</Link>,
        icon: <ArrowUpRight size={15} />,
      },
      { type: "divider" as const },
      {
        key: "logout",
        label: "Đăng xuất",
        icon: <LogOut size={15} />,
        onClick: () => void signOut(),
      },
    ],
  }
  return (
    <ConfigProvider theme={antdTheme}>
      <header className="mg-top mg-header">
        <div className="mg-header-context">
          <button
            type="button"
            className="mg-mobile mg-header-menu"
            aria-label="Mở menu"
            aria-expanded={mobile}
            onClick={() => setMobile(!mobile)}
          >
            <Menu size={21} />
          </button>
          <span className="mg-header-symbol">
            <RoleIcon size={22} />
          </span>
          <div className="mg-header-location">
            <strong>
              {admin ? "Không gian quản trị" : "Không gian đối tác"}
            </strong>
            <Breadcrumb
              separator="/"
              items={[
                {
                  title: (
                    <button
                      type="button"
                      className="mg-breadcrumb-home"
                      aria-label="Về tổng quan"
                      onClick={overview}
                    >
                      <Home size={12} />
                      Tổng quan
                    </button>
                  ),
                },
                ...(parent ? [{ title: parent.label }] : []),
                ...(section !== "dashboard"
                  ? [
                      {
                        title: (
                          <span
                            className="mg-breadcrumb-current"
                            aria-current="page"
                          >
                            {current.label}
                          </span>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
        <div className="mg-header-actions">
          <Link className="mg-header-website" to="/">
            Xem website
            <ArrowUpRight size={15} />
          </Link>
          <span className="mg-header-separator" />
          <Dropdown
            menu={menu}
            trigger={["click"]}
            placement="bottomRight"
            open={menuOpen}
            onOpenChange={setMenuOpen}
          >
            <button
              type="button"
              className="mg-header-profile"
              aria-label="Menu tài khoản"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="mg-header-avatar">
                {user.displayName.slice(0, 1).toLocaleUpperCase("vi")}
              </span>
              <span className="mg-header-profile-info">
                <strong>{user.displayName}</strong>
                <small>
                  <span />
                  {admin ? "Quản trị viên" : "Đối tác"}
                </small>
              </span>
              <ChevronDown
                size={15}
                className={menuOpen ? "mg-profile-chevron-open" : ""}
              />
            </button>
          </Dropdown>
        </div>
      </header>
    </ConfigProvider>
  )
}
