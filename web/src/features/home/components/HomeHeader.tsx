import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  Compass,
  Heart,
  LogOut,
  UserRound,
} from "lucide-react"

import { toast } from "sonner"

import { logout } from "@/services/httpClient"

import { useHomePage } from "@/features/home/hooks/useHomePage"

export default function HomeHeader({
  workspace,
}: {
  workspace: ReturnType<typeof useHomePage>
}) {
  const {
    user,
    client,
    account,
    setAccount,
    setAuth,
    setPersonal,
    unread,
    openGroup,
  } = workspace
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="OCOP GO Trang chủ">
        <span className="brand-mark">
          <Compass size={30} strokeWidth={1.6} />
          <i />
        </span>
        <span>
          OCOP<span className="brand-go">GO</span>
          <small>ĐẬM VỊ ĐỊA PHƯƠNG</small>
        </span>
      </a>
      <nav className="main-nav" aria-label="Điều hướng chính">
        <a className="active" href="/">
          Khám phá
        </a>
        <button onClick={() => openGroup("productTypeIds")}>
          Sản phẩm OCOP
          <ChevronDown size={12} />
        </button>
        <button
          onClick={() => {
            document
              .querySelector(".intro")
              ?.scrollIntoView({ behavior: "smooth" })
            toast.info(
              "Chọn một địa điểm để khám phá các trải nghiệm địa phương."
            )
          }}
        >
          Trải nghiệm địa phương
          <ArrowUpRight size={12} />
        </button>
      </nav>
      <div className="header-actions">
        <button
          className="header-action"
          aria-label="Yêu thích"
          onClick={() => (user ? setPersonal("favorites") : setAuth(true))}
        >
          <Heart size={20} />
          <span>Yêu thích</span>
        </button>
        <button
          className="header-action notification-button"
          aria-label="Thông báo"
          onClick={() => (user ? setPersonal("notifications") : setAuth(true))}
        >
          <Bell size={20} />
          {!!unread.data && <i>{unread.data > 9 ? "9+" : unread.data}</i>}
          <span>Thông báo</span>
        </button>
        <div className="account-wrap">
          <button
            className="account-button"
            onClick={() => (user ? setAccount(!account) : setAuth(true))}
          >
            <UserRound size={18} />
            <span>{user ? user.displayName : "Đăng nhập"}</span>
            <ChevronDown size={13} />
          </button>
          {account && user && (
            <div className="account-menu">
              <strong>{user.displayName}</strong>
              <small>{user.email}</small>
              <button
                onClick={async () => {
                  try {
                    await logout()
                    toast.success("Đã đăng xuất.")
                  } catch {
                    toast.error(
                      "Đã xóa đăng nhập trên trình duyệt, nhưng chưa xác nhận được thu hồi phiên trên máy chủ."
                    )
                  }
                  setAccount(false)
                  setPersonal(null)
                  client.removeQueries({ queryKey: ["unread"] })
                }}
              >
                <LogOut size={15} />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
