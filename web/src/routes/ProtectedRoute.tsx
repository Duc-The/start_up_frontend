import { Outlet, Link, Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { savedSession, getAccessToken } from "@/stores/authStore"
import AuthLayout from "@/layouts/AuthLayout"
export default function ProtectedRoute({ roles }: { roles: string[] }) {
  const user = useAuth(),
    location = useLocation()
  if (!user) {
    if (savedSession() && !getAccessToken())
      return (
        <div role="status" style={{ padding: 40 }}>
          Đang khôi phục phiên đăng nhập…
        </div>
      )
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    )
  }
  if (!roles.some((role) => user.roles.includes(role)))
    return (
      <AuthLayout>
        <h1>Chưa có quyền truy cập</h1>
        <p>Tài khoản của bạn không có vai trò phù hợp với trang này.</p>
        <Link to={user.roles.includes("PARTNER") ? "/partner" : "/"}>
          Về không gian của bạn
        </Link>
      </AuthLayout>
    )
  return <Outlet />
}
