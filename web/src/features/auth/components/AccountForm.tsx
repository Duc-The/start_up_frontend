import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowUpRight,
  Mail,
  Compass,
  LockKeyhole,
  UserRound,
  Check,
  LoaderCircle,
} from "lucide-react"
import { useAuthForm } from "../hooks/useAuthForm"
import { savedSession } from "@/stores/authStore"
import { authDestination } from "../utils/authRedirect"
export default function AccountForm({ mode }: { mode: "login" | "register" }) {
  const registration = mode === "register",
    navigate = useNavigate(),
    location = useLocation()
  const [visible, setVisible] = useState(false)
  const state = location.state as {
    from?: string
    registered?: boolean
    email?: string
  } | null
  const { form, submit, error, busy } = useAuthForm(
    registration,
    () =>
      navigate(authDestination(savedSession()?.user.roles || [], state?.from), {
        replace: true,
      }),
    (email) =>
      navigate("/login", {
        replace: true,
        state: { registered: true, email, from: state?.from },
      })
  )
  const { errors } = form.formState
  useEffect(() => {
    if (state?.email) form.setValue("email", state.email)
  }, [form, state?.email])
  return (
    <>
      <div className="account-form-heading">
        <div className="account-form-symbol">
          <span>
            {registration ? <UserRound size={22} /> : <Compass size={22} />}
          </span>
        </div>
        <h2>{registration ? "Bắt đầu khám phá" : "Chào bạn trở lại!"}</h2>
        <p>
          {registration
            ? "Tạo tài khoản để lưu những điểm đến yêu thích và bắt đầu hành trình của riêng bạn."
            : "Đăng nhập để tiếp tục những trải nghiệm và khám phá OCOP cùng chúng mình."}
        </p>
      </div>
      {!registration && state?.registered && (
        <div className="account-notice" role="status">
          <Check size={18} />
          Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.
        </div>
      )}
      <form className="account-form" onSubmit={submit} noValidate>
        {registration && (
          <label htmlFor="account-name">
            Tên hiển thị
            <div
              className={
                "account-input " + (errors.displayName ? "invalid" : "")
              }
            >
              <UserRound size={18} />
              <input
                id="account-name"
                autoComplete="name"
                placeholder="Bạn muốn chúng mình gọi là gì?"
                {...form.register("displayName")}
                aria-invalid={!!errors.displayName}
                aria-describedby="account-name-error"
              />
            </div>
            {errors.displayName && (
              <small id="account-name-error" role="alert">
                {errors.displayName.message}
              </small>
            )}
          </label>
        )}
        <label htmlFor="account-email">
          Email
          <div className={"account-input " + (errors.email ? "invalid" : "")}>
            <Mail size={18} />
            <input
              id="account-email"
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              {...form.register("email")}
              aria-invalid={!!errors.email}
              aria-describedby="account-email-error"
            />
          </div>
          {errors.email && (
            <small id="account-email-error" role="alert">
              {errors.email.message}
            </small>
          )}
        </label>
        <label htmlFor="account-password">
          Mật khẩu
          <div
            className={"account-input " + (errors.password ? "invalid" : "")}
          >
            <LockKeyhole size={18} />
            <input
              id="account-password"
              type={visible ? "text" : "password"}
              autoComplete={registration ? "new-password" : "current-password"}
              placeholder={
                registration ? "Tạo mật khẩu của bạn" : "Nhập mật khẩu"
              }
              {...form.register("password")}
              aria-invalid={!!errors.password}
              aria-describedby="account-password-error"
            />
            <button
              type="button"
              aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <small id="account-password-error" role="alert">
              {errors.password.message}
            </small>
          )}
          {registration && !errors.password && (
            <span className="account-hint">
              Dùng ít nhất 8 ký tự để bảo vệ tài khoản của bạn.
            </span>
          )}
        </label>
        {registration && (
          <label htmlFor="account-confirm">
            Nhập lại mật khẩu
            <div
              className={
                "account-input " + (errors.confirmPassword ? "invalid" : "")
              }
            >
              <LockKeyhole size={18} />
              <input
                id="account-confirm"
                type={visible ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu vừa tạo"
                {...form.register("confirmPassword")}
                aria-invalid={!!errors.confirmPassword}
                aria-describedby="account-confirm-error"
              />
            </div>
            {errors.confirmPassword && (
              <small id="account-confirm-error" role="alert">
                {errors.confirmPassword.message}
              </small>
            )}
          </label>
        )}
        {error && (
          <p className="account-error" role="alert">
            {error}
          </p>
        )}
        <button className="account-submit" disabled={busy} type="submit">
          {busy ? (
            <>
              <LoaderCircle className="account-spin" size={18} />
              Đang xử lý…
            </>
          ) : (
            <>
              {registration ? "Tạo tài khoản" : "Đăng nhập"}
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
      <div className="account-switch">
        {registration ? "Bạn đã có tài khoản?" : "Chưa có tài khoản OCOP GO?"}{" "}
        <Link
          to={registration ? "/login" : "/register"}
          state={{ from: state?.from }}
        >
          {registration ? "Đăng nhập ngay" : "Đăng ký miễn phí"}
          <ArrowUpRight size={14} />
        </Link>
      </div>
      <div className="account-divider">
        <span />
        Khám phá theo cách của bạn
        <span />
      </div>
      <Link className="account-guest" to="/">
        Tiếp tục khám phá không cần đăng nhập
        <ArrowRight size={15} />
      </Link>
    </>
  )
}
