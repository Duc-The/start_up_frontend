import { lazy, Suspense } from "react"
import { Routes, Route, Link } from "react-router-dom"
import ProtectedRoute from "./ProtectedRoute"
const LoginPage = lazy(() => import("@/pages/LoginPage"))
const RegisterPage = lazy(() => import("@/pages/RegisterPage"))
const HomePage = lazy(() => import("@/pages/HomePage"))
const PlaceMapPage = lazy(() => import("@/pages/PlaceMapPage"))
const ManagementPage = lazy(() => import("@/pages/ManagementPage"))
export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div role="status" style={{ padding: 40 }}>
          Đang tải trang…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/places/:poiId" element={<PlaceMapPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
          <Route path="/admin" element={<ManagementPage />} />
        </Route>
        <Route element={<ProtectedRoute roles={["PARTNER", "ADMIN"]} />}>
          <Route path="/partner" element={<ManagementPage />} />
          <Route path="/management" element={<ManagementPage />} />
        </Route>
        <Route
          path="*"
          element={
            <main>
              <h1>Không tìm thấy trang</h1>
              <Link to="/">Về trang chủ</Link>
            </main>
          }
        />
      </Routes>
    </Suspense>
  )
}
