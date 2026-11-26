import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { authApi } from "../api/authApi"
import { schemaForMode, type AuthFields } from "../types/authSchema"
import { saveSession } from "@/stores/authStore"
export function useAuthForm(
  isRegister: boolean,
  onClose: () => void,
  onRegistered: (email: string) => void
) {
  const [error, setError] = useState(""),
    [success, setSuccess] = useState("")
  const client = useQueryClient()
  const form = useForm<AuthFields>({
    resolver: zodResolver(schemaForMode(isRegister)),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      confirmPassword: "",
    },
    mode: "onTouched",
  })
  const submit = form.handleSubmit(async (fields) => {
    setError("")
    setSuccess("")
    try {
      if (isRegister) {
        await authApi.register({
          email: fields.email,
          password: fields.password,
          displayName: fields.displayName?.trim() || "",
        })
        onRegistered(fields.email)
        setSuccess("Đăng ký thành công. Bạn có thể đăng nhập ngay.")
      } else {
        saveSession(await authApi.login(fields))
        void client.invalidateQueries()
        onClose()
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Không thể đăng nhập. Vui lòng thử lại."
      )
    }
  })
  return {
    form,
    submit,
    error,
    success,
    busy: form.formState.isSubmitting,
    resetMessages() {
      setError("")
      setSuccess("")
      form.clearErrors()
    },
  }
}
