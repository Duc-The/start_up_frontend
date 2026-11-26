import type { ReactNode } from "react"
import { Leaf } from "lucide-react"
import "@/assets/styles/management.css"
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mg-login">
      <Leaf size={42} />
      {children}
    </main>
  )
}
