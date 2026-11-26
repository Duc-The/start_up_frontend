import { useEffect } from "react"
import AccountLayout from "@/layouts/AccountLayout"
import AccountForm from "@/features/auth/components/AccountForm"
export default function LoginPage() {
  useEffect(() => {
    const previous = document.title
    document.title = "Đăng nhập | OCOP GO"
    return () => {
      document.title = previous
    }
  }, [])
  return (
    <AccountLayout mode="login">
      <AccountForm mode="login" />
    </AccountLayout>
  )
}
