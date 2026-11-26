import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { ArrowLeft, Compass, MapPin, ArrowUpRight } from "lucide-react"
import namO from "@/assets/images/auth-nam-o.jpg"
import baLieu from "@/assets/images/auth-ba-lieu.jpg"
import "@/assets/styles/account.css"
export default function AccountLayout({
  mode,
  children,
}: {
  mode: "login" | "register"
  children: ReactNode
}) {
  const register = mode === "register"
  return (
    <div className={"account-page " + (register ? "account-register" : "")}>
      <aside className="account-story">
        <Link className="account-brand" to="/" aria-label="OCOP GO — Trang chủ">
          <span>
            <Compass size={28} />
          </span>
          OCOP<span>GO</span>
        </Link>
        <div className="account-story-heading">
          <h1>
            {register ? (
              <>
                Mỗi hành trình,
                <br />
                một điều <em>đáng nhớ.</em>
              </>
            ) : (
              <>
                Chạm bản sắc.
                <br />
                Mở <em>hành trình.</em>
              </>
            )}
          </h1>
          <p>
            Gặp những người làm nên sản phẩm.
            <br />
            Khám phá những câu chuyện của Đà Nẵng.
          </p>
        </div>
        <div className="account-photo">
          <img
            src={register ? baLieu : namO}
            alt={
              register
                ? "Sản phẩm khô mè Bà Liễu Mẹ tại cơ sở ở Đà Nẵng"
                : "Trải nghiệm ẩm thực tại cơ sở nước mắm Hương Làng Cổ"
            }
          />
          <span className="account-photo-tag">
            <MapPin size={14} />
            {register ? "Cẩm Lệ, Đà Nẵng" : "Nam Ô, Đà Nẵng"}
          </span>
          <Link
            to="/"
            className="account-photo-link"
            aria-label="Khám phá địa điểm OCOP"
          >
            <ArrowUpRight size={22} />
          </Link>
        </div>
        <footer>
          <span>Sản vật địa phương. Trải nghiệm nguyên bản.</span>
          <span>OCOP GO · Đà Nẵng</span>
        </footer>
      </aside>
      <main className="account-main">
        <header>
          <Link to="/">
            <ArrowLeft size={16} />
            Về trang khám phá
          </Link>
          <span>
            {register ? "Đã có tài khoản?" : "Bạn mới đến?"}{" "}
            <Link to={register ? "/login" : "/register"}>
              {register ? "Đăng nhập" : "Đăng ký"}
              <ArrowUpRight size={14} />
            </Link>
          </span>
        </header>
        <div className="account-form-container">{children}</div>
        <footer>
          OCOP GO <span>Chạm bản sắc · Mở hành trình</span>
        </footer>
      </main>
    </div>
  )
}
