import { Leaf, Plus, ArrowUpRight } from "lucide-react"

import AuthDialog from "@/features/auth/components/AuthDialog"

import defaults from "@/features/management/config/forms.json"

import "@/assets/styles/management.css"
import { useManagementWorkspace } from "@/features/management/hooks/useManagementWorkspace"

import Editor from "@/features/management/components/Editor"

import DashboardLayout from "@/layouts/DashboardLayout"

import ManagementOverview from "@/features/management/components/ManagementOverview"

import ManagementResourceList from "@/features/management/components/ManagementResourceList"

export default function ManagementPage() {
  const workspace = useManagementWorkspace()
  const {
    user,
    section,
    editor,
    setEditor,
    login,
    setLogin,
    admin,
    allowed,
    current,
    reload,
    createAllowed,
  } = workspace
  if (!allowed || !user)
    return (
      <div className="mg-login">
        <Leaf size={42} />
        <h1>
          Không gian quản lý
          <br />
          OCOP GO
        </h1>
        <p>
          {user
            ? "Tài khoản của bạn chưa có quyền quản lý."
            : "Đăng nhập để quản lý sản phẩm, địa điểm và những hành trình địa phương."}
        </p>
        <button onClick={() => setLogin(true)}>
          Đăng nhập tài khoản quản lý <ArrowUpRight size={18} />
        </button>
        <a href="/">Về trang khám phá</a>
        {login && <AuthDialog onClose={() => setLogin(false)} />}
      </div>
    )
  return (
    <>
      <DashboardLayout workspace={workspace}>
        <div className="mg-heading">
          <div>
            <h1>
              {section === "dashboard"
                ? "Chào " + user.displayName + ","
                : current.label}
            </h1>
            <p>
              {section === "dashboard"
                ? "Một nơi để chăm chút sản phẩm và những hành trình mang bản sắc địa phương."
                : "Quản lý thông tin, theo dõi trạng thái và cập nhật nội dung của bạn."}
            </p>
          </div>
          {createAllowed && (
            <button
              className="mg-primary"
              onClick={() =>
                setEditor({
                  id: "",
                  details: section.startsWith("catalogs/")
                    ? {
                        name: "",
                        code: "",
                        slug: "",
                        iconUrl: "",
                        colorHex: "#24823C",
                        parentId: null,
                        sortOrder: 0,
                        active: true,
                      }
                    : (defaults as Record<string, Record<string, unknown>>)[
                        section
                      ],
                })
              }
            >
              <Plus size={18} />
              Thêm mới
            </button>
          )}
        </div>
        {section === "dashboard" ? (
          <ManagementOverview workspace={workspace} />
        ) : (
          <ManagementResourceList workspace={workspace} />
        )}
      </DashboardLayout>
      {editor && (
        <Editor
          key={section + editor.id}
          section={section}
          row={editor}
          admin={admin}
          onClose={() => setEditor(null)}
          onDone={() => {
            setEditor(null)
            void reload()
          }}
        />
      )}
    </>
  )
}
