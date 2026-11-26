import { useEffect } from "react"
import AccountLayout from "@/layouts/AccountLayout"
import AccountForm from "@/features/auth/components/AccountForm"
export default function RegisterPage() {
  useEffect(() => {
    const previous = document.title
    document.title = "Đăng ký | OCOP GO"
    return () => {
      document.title = previous
    }
  }, [])
  return (
    <AccountLayout mode="register">
      <AccountForm mode="register" />
    </AccountLayout>
  )
}
